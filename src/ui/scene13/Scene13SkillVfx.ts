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

/**
 * 古战场金石矿物低饱和配色（契合《帝国时代2 DE》写实古典地面色调，杜绝现代网页荧光塑料感）：
 * - 攻战：朱砂赤铜 (#b83b1a) + 鎏金锋芒 (#e2b45a)
 * - 胜战：古青铜重盾 (#c4963c) + 温润苍玉 (#4e9a66)
 * - 敌战：玄铁松烟青黛 (#3b6e7c) + 寒铁银矛 (#d8e2e6)
 * - 混战：暮色瘴烟灰紫 (#7a5880) + 硝烟灰白 (#cfc2d4)
 * - 并战：虎符琥珀古金 (#cc922e) + 诏书牙白 (#efe6d2) + 古典靛青 (#45627d)
 * - 败战：玄铁黑羽箭 (#2a2420) + 暗殷红血痕 (#8f1d1d)
 */
const COLOR: Record<TacticalSixSet, string> = {
    gongzhan: '#b83b1a', // 朱砂赤铜
    dizhan: '#3b6e7c',   // 松烟青黛
    shengzhan: '#4e9a66', // 温润苍玉
    hunzhan: '#7a5880',  // 暮色烟紫
    bingzhan: '#cc922e', // 虎符古金
    baizhan: '#8f1d1d',  // 暗殷红血
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const easeOut = (p: number) => 1 - (1 - p) ** 3;
/** 三段式饱满保持曲线：前 70% 时间保持满清晰度（1.0），最后 30% 平滑淡出，确保镜头切过去能看清完整大场面 */
const holdFade = (p: number) => (p < 0.70 ? 1.0 : clamp01((1 - p) / 0.30));

// ── 1. 离屏预烘焙古法金石冷兵器剪影图标池 ──
type IconKind = 'swords' | 'shield' | 'banner' | 'dizzy' | 'defect' | 'slashKill' | 'dustPuff';
const iconStampCache = new Map<string, HTMLCanvasElement>();
const haloStampCache = new Map<string, HTMLCanvasElement>();

/** 柔和无硬边的古战场矿物色地面光晕/烟尘团（彻底替代死板的 CAD 椭圆线框） */
function getSoftGroundHalo(colHex: string): HTMLCanvasElement {
    let cv = haloStampCache.get(colHex);
    if (cv) return cv;
    cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 96;
    const g = cv.getContext('2d')!;
    const r = parseInt(colHex.slice(1, 3), 16) || 160;
    const gr = parseInt(colHex.slice(3, 5), 16) || 120;
    const b = parseInt(colHex.slice(5, 7), 16) || 80;
    const grad = g.createRadialGradient(48, 48, 4, 48, 48, 46);
    grad.addColorStop(0, `rgba(${r}, ${gr}, ${b}, 0.42)`);
    grad.addColorStop(0.52, `rgba(${r}, ${gr}, ${b}, 0.18)`);
    grad.addColorStop(1, `rgba(${r}, ${gr}, ${b}, 0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, 96, 96);
    haloStampCache.set(colHex, cv);
    return cv;
}

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
        // 【攻】提升攻击：单把昂扬宽刃战刀 + 鎏金向上提升双箭纹（刀 + ▲▲，朱砂赤铜配寒铁白刃）
        g.save();
        g.translate(32, 32);

        g.save();
        g.translate(-5, 3);
        g.rotate(Math.PI * 0.14);

        // 外廓深褐铁衬底
        g.fillStyle = '#180c06';
        g.beginPath();
        g.moveTo(-6, 13);
        g.lineTo(-6, -15);
        g.quadraticCurveTo(-5, -28, 3, -31);
        g.quadraticCurveTo(9, -18, 7, 13);
        g.closePath();
        g.fill();

        // 刀身：朱砂赤铜刀背 ➔ 古金中脊 ➔ 寒铁雪白刀刃
        const bladeGrad = g.createLinearGradient(-5, 0, 7, 0);
        bladeGrad.addColorStop(0, '#9e2f14');
        bladeGrad.addColorStop(0.48, paid ? '#edd27a' : '#d9a754');
        bladeGrad.addColorStop(1, '#f5efe6');
        g.fillStyle = bladeGrad;
        g.beginPath();
        g.moveTo(-3.8, 10);
        g.lineTo(-3.8, -14);
        g.quadraticCurveTo(-3, -25, 2.5, -28);
        g.quadraticCurveTo(7.2, -16, 4.8, 10);
        g.closePath();
        g.fill();

        // 刀身血槽亮线
        g.strokeStyle = '#f5efe6';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(-1, 7);
        g.lineTo(-0.5, -20);
        g.stroke();

        // 古铜刀镡护手与朱漆刀柄
        g.strokeStyle = '#180c06';
        g.lineWidth = 6.8;
        g.beginPath();
        g.moveTo(-10, 10);
        g.lineTo(10, 10);
        g.stroke();
        g.strokeStyle = '#d4a349';
        g.lineWidth = 3.6;
        g.beginPath();
        g.moveTo(-8.5, 10);
        g.lineTo(8.5, 10);
        g.stroke();

        g.fillStyle = '#180c06';
        g.fillRect(-4.2, 11, 8.4, 12);
        g.fillStyle = '#8c2314';
        g.fillRect(-2.6, 12, 5.2, 10);
        g.restore();

        // 右上侧两道「向上提升箭纹（▲▲）」：古鎏金与赤铜色
        const drawUpChevron = (cx: number, cy: number, w: number, h: number, col: string) => {
            g.strokeStyle = '#180c06';
            g.lineWidth = 6.2;
            g.beginPath();
            g.moveTo(cx - w, cy + h);
            g.lineTo(cx, cy);
            g.lineTo(cx + w, cy + h);
            g.stroke();

            g.strokeStyle = col;
            g.lineWidth = 3.5;
            g.beginPath();
            g.moveTo(cx - w, cy + h);
            g.lineTo(cx, cy);
            g.lineTo(cx + w, cy + h);
            g.stroke();
        };
        drawUpChevron(14, -19, 8.2, 8.2, '#e8c468');
        drawUpChevron(14, -6, 8.2, 8.2, paid ? '#e2b45a' : '#c76d32');

        g.restore();
    } else if (kind === 'shield') {
        // 【胜】古青铜重装塔盾（古铜金包边 + 玄铁苍玉盾芯 + 十字铜脊）
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
        // 深色玄铁外衬
        g.fillStyle = '#121710';
        buildShieldPath(1.12);
        g.fill();
        // 外框古青铜鎏金包边
        const rimGrad = g.createLinearGradient(-20, -25, 20, 25);
        rimGrad.addColorStop(0, '#e6c87a');
        rimGrad.addColorStop(0.5, '#b88932');
        rimGrad.addColorStop(1, '#5e4214');
        g.fillStyle = rimGrad;
        buildShieldPath(1.0);
        g.fill();
        // 盾面内芯（沉稳玄铁苍绿，不刺眼）
        const innerGrad = g.createLinearGradient(0, -18, 0, 20);
        innerGrad.addColorStop(0, paid ? '#e0c370' : '#4a7c59');
        innerGrad.addColorStop(0.55, paid ? '#9c7121' : '#2e4f38');
        innerGrad.addColorStop(1, '#192b1f');
        g.fillStyle = innerGrad;
        buildShieldPath(0.78);
        g.fill();
        // 中央竖向古铜盾脊与横加强筋
        g.strokeStyle = '#e8cf8c';
        g.lineWidth = 3.6;
        g.beginPath();
        g.moveTo(0, -18);
        g.lineTo(0, 19);
        g.moveTo(-13, -3);
        g.lineTo(13, -3);
        g.stroke();
        g.restore();
    } else if (kind === 'banner') {
        // 【敌】玄铁松烟青三角牙旗/令旗（古典松烟青黛旗面 + 银白铁矛杆 + 古铜矛头）
        g.save();
        g.translate(32, 32);
        // 旗面外衬玄墨边
        g.fillStyle = '#10181c';
        g.beginPath();
        g.moveTo(-12, -22);
        g.lineTo(27, -9);
        g.lineTo(-12, 7);
        g.closePath();
        g.fill();
        // 旗面松烟青黛渐变（低饱和沉稳青铁色）
        const flagGrad = g.createLinearGradient(-11, -20, 24, -4);
        flagGrad.addColorStop(0, paid ? '#e6c87a' : '#6896a3');
        flagGrad.addColorStop(0.55, paid ? '#b5842b' : '#3b6e7c');
        flagGrad.addColorStop(1, '#20404a');
        g.fillStyle = flagGrad;
        g.beginPath();
        g.moveTo(-10, -19);
        g.lineTo(23, -9);
        g.lineTo(-10, 4);
        g.closePath();
        g.fill();
        // 旗面牙白暗金镶边
        g.strokeStyle = '#dce6e8';
        g.lineWidth = 2.0;
        g.stroke();
        // 旗杆与矛尖
        g.strokeStyle = '#10181c';
        g.lineWidth = 6.6;
        g.beginPath();
        g.moveTo(-10, -24);
        g.lineTo(-10, 25);
        g.stroke();
        g.strokeStyle = '#d8e2e6';
        g.lineWidth = 3.2;
        g.beginPath();
        g.moveTo(-10, -24);
        g.lineTo(-10, 25);
        g.stroke();
        // 古铜金矛头
        g.fillStyle = '#d4a84f';
        g.beginPath();
        g.moveTo(-10, -30);
        g.lineTo(-15, -19);
        g.lineTo(-5, -19);
        g.closePath();
        g.fill();
        g.restore();
    } else if (kind === 'dizzy') {
        // 【混】乱阵暮色瘴烟双螺旋环（低饱和烟紫 + 硝烟灰白）
        g.save();
        g.translate(32, 32);
        g.scale(1, 0.68);
        g.strokeStyle = '#1e1524';
        g.lineWidth = 7.8;
        g.beginPath();
        g.arc(0, 0, 22, 0.15, Math.PI * 1.6);
        g.stroke();
        g.beginPath();
        g.arc(0, 0, 12, Math.PI * 0.85, Math.PI * 2.4);
        g.stroke();

        g.strokeStyle = paid ? '#dfc06c' : '#8c6794';
        g.lineWidth = 4.4;
        g.beginPath();
        g.arc(0, 0, 22, 0.15, Math.PI * 1.6);
        g.stroke();
        g.strokeStyle = '#d8cedb';
        g.lineWidth = 3.4;
        g.beginPath();
        g.arc(0, 0, 12, Math.PI * 0.85, Math.PI * 2.4);
        g.stroke();
        g.restore();
    } else if (kind === 'defect') {
        // 【并】虎符琥珀古金 × 古典靛青倒戈回旋双箭（⇄）
        g.save();
        g.translate(32, 32);
        const drawTurnArrow = (rot: number, col: string) => {
            g.save();
            g.rotate(rot);
            g.strokeStyle = '#141920';
            g.lineWidth = 7.6;
            g.beginPath();
            g.arc(0, 0, 16, -Math.PI * 0.78, Math.PI * 0.18);
            g.stroke();
            g.strokeStyle = col;
            g.lineWidth = 4.2;
            g.beginPath();
            g.arc(0, 0, 16, -Math.PI * 0.78, Math.PI * 0.18);
            g.stroke();
            g.fillStyle = '#141920';
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
        drawTurnArrow(0, '#d49b38');
        drawTurnArrow(Math.PI, '#52738c');
        g.restore();
    } else if (kind === 'slashKill') {
        // 【败】暗殷红血刃交叉破甲斩痕（✕）
        g.save();
        g.translate(32, 32);
        const drawSlash = (ang: number) => {
            g.save();
            g.rotate(ang);
            g.fillStyle = '#1f0707';
            g.beginPath();
            g.moveTo(-28, 0);
            g.quadraticCurveTo(0, -7.0, 28, 0);
            g.quadraticCurveTo(0, 7.0, -28, 0);
            g.closePath();
            g.fill();
            g.fillStyle = '#991b1b';
            g.beginPath();
            g.moveTo(-26, 0);
            g.quadraticCurveTo(0, -4.8, 26, 0);
            g.quadraticCurveTo(0, 4.8, -26, 0);
            g.closePath();
            g.fill();
            g.fillStyle = '#f2dede';
            g.beginPath();
            g.moveTo(-19, 0);
            g.quadraticCurveTo(0, -2.0, 19, 0);
            g.quadraticCurveTo(0, 2.0, -19, 0);
            g.closePath();
            g.fill();
            g.restore();
        };
        drawSlash(Math.PI * 0.23);
        drawSlash(-Math.PI * 0.23);
        g.restore();
    } else {
        // 柔和古战场黄土烟尘团印章
        const grad = g.createRadialGradient(32, 32, 2, 32, 32, 29);
        grad.addColorStop(0, 'rgba(218, 200, 168, 0.78)');
        grad.addColorStop(0.55, 'rgba(172, 152, 118, 0.42)');
        grad.addColorStop(1, 'rgba(115, 98, 72, 0)');
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

// ── 2. 冷兵器几何图元：刀锋弧线、玄铁黑羽箭、温润苍玉回血十字 ──
function drawTaperedCrescent(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    thickness: number,
    spanAngle: number,
    outerColor: string,
    coreColor = '#f5efe2',
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
    coreColor = '#f3ece0',
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

    const cw = maxHalfWidth * 0.44;
    ctx.fillStyle = coreColor;
    ctx.beginPath();
    ctx.moveTo(x1 + dx * 0.08, y1 + dy * 0.08);
    ctx.quadraticCurveTo(mx + nx * cw, my + ny * cw, x2 - dx * 0.08, y2 - dy * 0.08);
    ctx.quadraticCurveTo(mx - nx * cw, my - ny * cw, x1 + dx * 0.08, y1 + dy * 0.08);
    ctx.closePath();
    ctx.fill();
}

/** 绘制古战场实体羽箭（玄铁黑羽木杆 + 寒铁三棱箭簇 / 虎符古金令箭） */
function drawWarArrow(
    ctx: CanvasRenderingContext2D,
    tailX: number,
    tailY: number,
    tipX: number,
    tipY: number,
    scale = 1,
    isGoldArrow = false,
): void {
    const dx = tipX - tailX;
    const dy = tipY - tailY;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const nx = -uy;
    const ny = ux;

    // 克制的破空风线
    ctx.strokeStyle = isGoldArrow ? 'rgba(212, 155, 56, 0.52)' : 'rgba(216, 226, 230, 0.42)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX - ux * 18 * scale, tailY - uy * 18 * scale);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // 箭杆（玄铁黑褐木杆 + 桦木/古金杆芯）
    ctx.strokeStyle = '#1a1410';
    ctx.lineWidth = 3.8 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX - ux * 4 * scale, tipY - uy * 4 * scale);
    ctx.stroke();

    ctx.strokeStyle = isGoldArrow ? '#d49b38' : '#b8a386';
    ctx.lineWidth = 2.0 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tipX - ux * 4 * scale, tipY - uy * 4 * scale);
    ctx.stroke();

    // 尾羽（并战令箭为牙白雕翎，败战箭雨为玄黑苍灰雕翎）
    const fLen = 8.5 * scale;
    const fW = 3.8 * scale;
    ctx.fillStyle = isGoldArrow ? '#efe6d2' : '#332d29';
    ctx.strokeStyle = '#14110f';
    ctx.lineWidth = 1.0 * scale;
    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(tailX - ux * fLen + nx * fW, tailY - uy * fLen + ny * fW);
    ctx.lineTo(tailX + ux * 4.5 * scale, tailY + uy * 4.5 * scale);
    ctx.lineTo(tailX - ux * fLen - nx * fW, tailY - uy * fLen - ny * fW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 寒铁三棱箭簇
    const headLen = 10.0 * scale;
    const headW = 4.2 * scale;
    ctx.fillStyle = isGoldArrow ? '#e8c468' : '#e2e8f0';
    ctx.strokeStyle = '#141920';
    ctx.lineWidth = 1.3 * scale;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - ux * headLen + nx * headW, tipY - uy * headLen + ny * headW);
    ctx.lineTo(tipX - ux * (headLen * 0.72), tipY - uy * (headLen * 0.72));
    ctx.lineTo(tipX - ux * headLen - nx * headW, tipY - uy * headLen - ny * headW);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

/** 绘制温润苍玉十字  号（深墨玉外衬＋苍玉外层＋玉白内芯） */
function drawHealPlus(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    arm: number,
    thick: number,
    outerColor = '#4e9a66',
    coreColor = '#e6f2ea',
): void {
    const drawCross = (a: number, t: number) => {
        const h = t * 0.5;
        ctx.fillRect(cx - a, cy - h, a * 2, t);
        ctx.fillRect(cx - h, cy - a, t, a * 2);
    };
    ctx.fillStyle = '#102416';
    drawCross(arm + 1.5, thick + 2.6);
    ctx.fillStyle = outerColor;
    drawCross(arm, thick);
    ctx.fillStyle = coreColor;
    drawCross(arm * 0.70, thick * 0.44);
}

// ── 3. 状态追踪：对齐 4.5 秒镜头 ──
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
    return v.paid ? 1.32 : v.playerCast ? 1.15 : 1.02;
}

// ── 4. 释放瞬间地面层（去掉死板 CAD 大椭圆线框，改用战场尘烟与低饱和金石柔晕） ──
function drawGroundOne(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.45);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const col = COLOR[v.six];
    const dust = getColdWeaponIcon('dustPuff');
    const halo = getSoftGroundHalo(col);

    ctx.save();

    // 1. 地面柔和矿物色气场晕染 + 踏阵扬尘（无任何死板几何椭圆实线框）
    const baseRx = (56 + e * (v.six === 'hunzhan' ? 165 : 195)) * scale;
    const baseRy = baseRx * 0.48;
    ctx.globalAlpha = fade * 0.72;
    drawStamp(ctx, halo, x, y, baseRx, baseRy);

    if (v.six === 'gongzhan' || v.six === 'shengzhan' || v.six === 'dizhan') {
        for (let k = 0; k < 8; k++) {
            const ang = k * (TAU / 8) + e * 0.25;
            const dx = x + Math.cos(ang) * baseRx * 0.72;
            const dy = y + Math.sin(ang) * baseRy * 0.72;
            ctx.globalAlpha = fade * 0.52;
            drawStamp(ctx, dust, dx, dy, 36 * scale, 20 * scale);
        }
    }

    // 攻战计地面：沿冲锋方向的 3 排朱砂鎏金突击指向箭纹（>>>>）
    if (v.six === 'gongzhan') {
        const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
        const px = -dy, py = dx;
        for (let k = 0; k <= 2; k++) {
            const advance = (e * 98 + (k - 0.5) * 36) * scale;
            const cx = x + dx * advance;
            const cy = y + dy * advance;
            const wing = 42 * scale;
            const back = 21 * scale;
            ctx.globalAlpha = fade * (0.85 - Math.abs(k - 1) * 0.16);
            ctx.strokeStyle = '#1c0d06';
            ctx.lineWidth = 6.6 * scale;
            ctx.beginPath();
            ctx.moveTo(cx - dx * back + px * wing, cy - dy * back + py * wing * 0.55);
            ctx.lineTo(cx + dx * 12, cy + dy * 12);
            ctx.lineTo(cx - dx * back - px * wing, cy - dy * back - py * wing * 0.55);
            ctx.stroke();

            ctx.strokeStyle = v.paid ? '#e6c87a' : '#d49b42';
            ctx.lineWidth = 3.8 * scale;
            ctx.stroke();
        }
    }

    // 2. 敌战计（伏兵出兵口疏朗扬尘，不画蓝圈）与 败战计（箭雨落点尘烟与暗殷红柔影）
    if (v.six === 'dizhan') {
        const step = Math.max(1, Math.ceil(v.points.length / 8));
        for (let i = 0; i < v.points.length; i += step) {
            const pt = v.points[i];
            const py = pt.y - lift(pt.x, pt.y);
            ctx.globalAlpha = fade * 0.75;
            drawStamp(ctx, dust, pt.x, py, (28 + e * 24) * scale, (16 + e * 13) * scale);
        }
    } else if (v.six === 'baizhan') {
        const useTargets = v.targets.length > 0;
        const srcLen = useTargets ? v.targets.length : v.points.length;
        const pn = Math.min(srcLen, 48);
        for (let i = 0; i < pn; i++) {
            const idx = Math.floor(i * srcLen / pn);
            const pt = useTargets ? v.targets[idx] : v.points[idx];
            const py = pt.y - lift(pt.x, pt.y);
            const delay = ((i * 0.618034) % 1) * 0.35;
            const localP = clamp01((p - delay) / (1 - delay));
            const fallFrac = 0.28;
            if (localP >= fallFrac) {
                const ip = (localP - fallFrac) / (1 - fallFrac);
                const ie = easeOut(Math.min(1, ip * 1.8));
                ctx.globalAlpha = fade * 0.62;
                drawStamp(ctx, dust, pt.x, py, (18 + ie * 12) * scale, (10 + ie * 6) * scale);
                ctx.globalAlpha = fade * 0.45 * (1 - ip * 0.4);
                drawStamp(ctx, halo, pt.x, py, (14 + ie * 12) * scale, (8 + ie * 6) * scale);
            }
        }
    }
    ctx.restore();
}

// ── 5. 释放瞬间上层大场面（古法金石配色 + 疏朗写实器物） ──

/** 【攻战计·振己威】三道朱砂赤铜刀罡破阵 + 破风寒铁刀芒 + 阵心主将「单刀+▲▲」印记 */
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

    // 1. 3 道锥形破阵朱砂赤金刀罡
    ctx.save();
    ctx.translate(cx + dx * (e * 96 * scale - 18), cy + dy * (e * 96 * scale - 18));
    ctx.rotate(v.angle);
    for (let k = 0; k < 3; k++) {
        const r = (62 + k * 32 + e * 40) * scale;
        const thick = (20 - k * 4.0) * scale * (1 - p * 0.25);
        ctx.globalAlpha = fade * (0.92 - k * 0.18);
        drawTaperedCrescent(
            ctx,
            -24 + k * 16,
            0,
            r,
            thick,
            Math.PI * (0.90 - k * 0.07),
            k === 0 ? '#d49b42' : COLOR.gongzhan,
            '#f5efe2',
        );
    }
    ctx.restore();

    // 2. 8 道疏朗寒铁破风枪芒
    for (let i = 0; i < 8; i++) {
        const off = (i - 3.5) * 26 * scale;
        const waveP = (p * 1.55 + (i % 3) * 0.22) % 1;
        const travel = easeOut(waveP) * (115 + (i % 3) * 28) * scale;
        const sx = cx + px * off + dx * (travel - 64);
        const sy = cy + py * off + dy * (travel - 64);
        const len = (86 - waveP * 20) * scale;
        const ex = sx + dx * len;
        const ey = sy + dy * len;
        ctx.globalAlpha = fade * (1 - waveP * 0.45) * 0.86;
        drawTaperedSlash(
            ctx,
            sx,
            sy,
            ex,
            ey,
            (5.0 - (i % 3) * 0.7) * scale,
            i % 2 === 0 ? '#b83b1a' : '#c9a66b',
            '#f5efe6',
        );
    }

    // 3. 阵心上方主将「战刀 + ▲▲」印记
    const pulse = 1 + 0.07 * Math.sin(p * Math.PI * 6);
    const iconY = cy - 26 - e * 14 * scale;
    ctx.globalAlpha = fade * 0.96;
    drawStamp(ctx, swordsIcon, cx, iconY, 40 * scale * pulse);
    ctx.restore();
}

/** 【敌战计·伏兵偷袭】中军松烟青大帅旗 + 疏朗出兵代表点黄尘、寒铁银矛芒与令旗（彻底去除蓝色栅栏与大圆框） */
function drawReinforce(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y);
    const bannerIcon = getColdWeaponIcon('banner', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();

    // 1. 中军主帅令旗猎猎挥动（不画死板蓝圈）
    const dropOffset = (1 - easeOut(Math.min(1, p * 3.2))) * 40 * scale;
    const sway = Math.sin(p * Math.PI * 5) * 3 * scale;
    ctx.globalAlpha = fade * 0.75;
    drawStamp(ctx, dust, cx, cy - 6, 54 * scale, 28 * scale);
    ctx.globalAlpha = fade * 0.96;
    drawStamp(ctx, bannerIcon, cx + sway, cy - 36 * scale - dropOffset, 40 * scale);

    // 2. 伏兵出兵口疏朗抽样（最多取 6 个代表点，杜绝几十面蓝旗挤成塑料栅栏挡住兵模）
    const totalPts = v.points.length;
    const maxClusters = Math.min(totalPts, 6);
    for (let c = 0; c < maxClusters; c++) {
        const idx = Math.floor((c + 0.5) * totalPts / maxClusters);
        const pt = v.points[idx];
        const y = pt.y - lift(pt.x, pt.y);
        ctx.globalAlpha = fade * 0.80;
        drawStamp(ctx, dust, pt.x, y - 8 * scale, (34 + e * 22) * scale, (20 + e * 12) * scale);
        for (let s = -1; s <= 1; s++) {
            const sx = pt.x + s * 11 * scale;
            const sy = y - 2;
            const spearH = (40 + e * 24 - Math.abs(s) * 6) * scale;
            ctx.globalAlpha = fade * 0.88;
            drawTaperedSlash(ctx, sx, sy, sx + s * 3, sy - spearH, 3.4 * scale, '#3b6e7c', '#e6eef0');
        }
        ctx.globalAlpha = fade * 0.95;
        drawStamp(ctx, bannerIcon, pt.x, y - (32 + e * 14) * scale, 24 * scale);
    }
    ctx.restore();
}

/** 【胜战计·固己防】8 面古青铜重盾绕阵顿地列阵 + 温润苍玉  升腾（去掉死板大圆框） */
function drawShield(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const rx = (64 + e * 124) * scale;
    const ry = rx * 0.48;
    const shieldIcon = getColdWeaponIcon('shield', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();

    // 1. 8 面古青铜重装塔盾绕阵顿地（每面盾落地激起一团踏阵尘土，不画死板椭圆连接线）
    const slamDrop = (1 - easeOut(Math.min(1, p * 3.5))) * 38 * scale;
    const shieldCount = 8;
    for (let k = 0; k < shieldCount; k++) {
        const ang = k * (TAU / shieldCount) + p * 0.35;
        const sx = x + Math.cos(ang) * rx;
        const sy = y + Math.sin(ang) * ry - 12 * scale - slamDrop;
        ctx.globalAlpha = fade * 0.55;
        drawStamp(ctx, dust, sx, sy + 14 * scale, 26 * scale, 14 * scale);
        ctx.globalAlpha = fade * 0.95;
        drawStamp(ctx, shieldIcon, sx, sy, 26 * scale);
    }

    // 阵心主帅巨盾印记
    const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
    ctx.globalAlpha = fade * 0.96;
    drawStamp(ctx, shieldIcon, x, y - 36 * scale - slamDrop, 38 * scale * pulse);

    // 2. 温润苍玉回血  号疏朗升腾
    const plusOffsets = [
        { dx: 0, dy: -0.58, s: 1.45 },
        { dx: -0.46, dy: -0.24, s: 1.15 },
        { dx: 0.46, dy: -0.24, s: 1.15 },
        { dx: -0.28, dy: -0.78, s: 1.05 },
        { dx: 0.28, dy: -0.78, s: 1.05 },
        { dx: -0.34, dy: 0.28, s: 0.95 },
        { dx: 0.34, dy: 0.28, s: 0.95 },
    ];
    for (let i = 0; i < plusOffsets.length; i++) {
        const po = plusOffsets[i];
        const rise = (p * 1.45 + i * 0.15) % 1;
        const px = x + po.dx * rx;
        const py = y + po.dy * ry - 14 * scale - rise * 34 * scale;
        ctx.globalAlpha = fade * (1 - rise * 0.42) * 0.94;
        drawHealPlus(ctx, px, py, 13 * po.s * scale, 4.8 * po.s * scale, COLOR.shengzhan, '#e6f2ea');
    }
    ctx.restore();
}

/** 【混战计·乱敌阵】暮色瘴烟灰紫迷障乱流 + 阵心眩晕双螺旋涡 */
function drawPanic(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const x = v.x, y = v.y - lift(v.x, v.y) - 14;
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const dizzyIcon = getColdWeaponIcon('dizzy', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();
    ctx.globalAlpha = fade * 0.68;
    drawStamp(ctx, dust, x, y, 120 * scale, 64 * scale);

    // 4 层低饱和暮色瘴烟旋流
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, 0.56);
    for (let i = 0; i < 4; i++) {
        const r = (38 + i * 28 + e * 30) * scale;
        const a = (i % 2 ? -1 : 1) * p * 6.8 + i * 1.4;
        ctx.save();
        ctx.rotate(a);
        ctx.globalAlpha = fade * (0.86 - i * 0.12);
        drawTaperedCrescent(
            ctx,
            0,
            0,
            r,
            (10 - i * 1.2) * scale,
            Math.PI * 1.15,
            i % 2 === 0 ? COLOR.hunzhan : '#a693ad',
            '#e4dce8',
        );
        ctx.restore();
    }
    ctx.restore();

    // 阵心旋转眩晕螺旋印
    ctx.save();
    ctx.translate(x, y - 22 * scale);
    ctx.rotate(p * 6.0);
    ctx.globalAlpha = fade * 0.96;
    drawStamp(ctx, dizzyIcon, 0, 0, 38 * scale);
    ctx.restore();
    ctx.restore();
}

/** 【并战计·夺敌兵】阵心虎符倒戈易帜印 + 疏朗虎符古金招降令箭射向倒戈军阵（去掉死板椭圆框） */
function drawConvert(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y) - 16;
    const defectIcon = getColdWeaponIcon('defect', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    ctx.save();

    // 1. 阵心柔和尘烟 + 虎符倒戈易帜双箭印
    ctx.globalAlpha = fade * 0.65;
    drawStamp(ctx, dust, x, y + 6, 68 * scale, 36 * scale);

    ctx.save();
    ctx.translate(x, y - 14 * scale);
    ctx.rotate(p * Math.PI * 2.0);
    ctx.globalAlpha = fade * 0.96;
    drawStamp(ctx, defectIcon, 0, 0, 38 * scale);
    ctx.restore();

    // 2. 疏朗抽样（最多 18 支）虎符古金招降令箭沿抛物线射向倒戈士兵
    const n = Math.min(v.targets.length, 18);
    for (let i = 0; i < n; i++) {
        const m = v.targets[Math.floor(i * v.targets.length / n)];
        if (m.hp <= 0) continue;
        const my = m.y - lift(m.x, m.y) - 18;
        const cpx = (x + m.x) * 0.5;
        const cpy = Math.min(y, my) - 64 - (i % 3) * 16;

        ctx.globalAlpha = fade * 0.48;
        ctx.strokeStyle = i % 2 ? '#d49b38' : '#52738c';
        ctx.lineWidth = 2.0;
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
        const tailX = px - (tx / tLen) * 22;
        const tailY = py - (ty / tLen) * 22;

        ctx.globalAlpha = fade * 0.94;
        drawWarArrow(ctx, tailX, tailY, px, py, 1.25, true);
    }
    ctx.restore();
}

/** 【败战计·减敌兵】玄铁黑羽箭雨齐射覆盖敌阵 + 暗殷红破甲斩痕与插地箭杆留存 */
function drawDefeat(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const fade = holdFade(p);
    const scale = tierScale(v);
    const slashIcon = getColdWeaponIcon('slashKill', v.paid);
    const dust = getColdWeaponIcon('dustPuff');

    const useTargets = v.targets.length > 0;
    const srcLen = useTargets ? v.targets.length : v.points.length;
    const n = Math.min(srcLen, 72);
    const unitScale = v.paid ? 1.26 : 1.12;

    const uFallX = -96 * unitScale;
    const uFallY = -240 * unitScale;

    ctx.save();

    // 1. 敌阵上空 48 支玄铁黑羽背景箭雨齐射
    const cx = v.x;
    const cy = v.y - lift(v.x, v.y) - 8;
    for (let k = 0; k < 48; k++) {
        const delay = ((k * 0.381966) % 1) * 0.52;
        if (p < delay) continue;
        const lp = clamp01((p - delay) / 0.36);
        const ang = k * 2.39996;
        const rad = Math.sqrt((k + 0.5) / 48) * 185 * scale;
        const tx = cx + Math.cos(ang) * rad;
        const ty = cy + Math.sin(ang) * rad * 0.5;
        if (lp < 1) {
            const tipX = tx + uFallX * (1 - lp);
            const tipY = ty + uFallY * (1 - lp);
            const tailX = tipX + uFallX * 0.16;
            const tailY = tipY + uFallY * 0.16;
            ctx.globalAlpha = fade * 0.90;
            drawWarArrow(ctx, tailX, tailY, tipX, tipY, 1.28 * scale, v.paid);
        } else {
            ctx.globalAlpha = fade * 0.72;
            drawWarArrow(ctx, tx + uFallX * 0.11, ty + uFallY * 0.11, tx, ty, 1.05 * scale, v.paid);
        }
    }

    // 2. 命中折损敌兵的玄铁羽箭与暗殷红破甲斩痕
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

            ctx.globalAlpha = (0.72 + fp * 0.26) * fade;
            drawWarArrow(ctx, tx, ty, hx, hy, 1.32 * unitScale, v.paid);
        } else {
            const ip = (localP - fallFrac) / (1 - fallFrac);

            if (ip < 0.62 && i % 2 === 0) {
                const slashAlpha = (1 - (ip / 0.62) ** 1.4) * 0.92 * fade;
                ctx.globalAlpha = slashAlpha;
                drawStamp(ctx, slashIcon, pt.x, py - 10, (16 + ip * 8) * unitScale);
            }

            ctx.globalAlpha = fade * 0.90;
            const plantedTailX = pt.x + uFallX * 0.13;
            const plantedTailY = py + 4 + uFallY * 0.13;
            drawWarArrow(ctx, plantedTailX, plantedTailY, pt.x, py + 4, 1.15 * unitScale, v.paid);

            if (i % 3 === 0) {
                ctx.globalAlpha = fade * 0.52;
                drawStamp(ctx, dust, pt.x, py + 2, 15 * unitScale, 8 * unitScale);
            }
        }
    }
    ctx.restore();
}

/** 观众献计／打赏天降帅令柔和金晕（去掉死板大椭圆线框） */
function drawPatronBurst(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    if (!v.playerCast) return;
    const expandP = clamp01(p * 1.4);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const goldHalo = getSoftGroundHalo('#d49b38');

    ctx.save();
    ctx.globalAlpha = fade * (v.paid ? 0.65 : 0.45);
    drawStamp(ctx, goldHalo, x, y, 64 + e * 180, 32 + e * 88);
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

/**
 * ── 7. 【新版 DE 原生 Flipbook 序列帧 ＋ 官方厚涂图标勋章体系】（与旧版并存，旧版代码一行未删） ──
 * 支持三种运行模式（默认 'new'，也可随时在控制台切换 `window.__SKILL_VFX_MODE = 'old' | 'new' | 'both'`）：
 *   - 'new'  : 使用 AoE2 DE 原生 `/SUCAI_FX/` 序列帧（GROUND_STRIKE / EXPLODING_BOLT / IMPACT_DUST /UNIT_DUST / TREBUCHET_SMOKE / BLOOD）＋ `/de-techtree/icons/Tech/` 官方手绘油画图标勋章
 *   - 'old'  : 使用上方完整保留的旧版古法金石矢量特效
 *   - 'both' : 新旧两套同时叠加对比
 */
export type SkillVfxRenderMode = 'new' | 'old' | 'both';
let currentSkillVfxMode: SkillVfxRenderMode = 'new';

export function setSkillVfxRenderMode(mode: SkillVfxRenderMode): void {
    currentSkillVfxMode = mode;
}

function getActiveSkillVfxMode(): SkillVfxRenderMode {
    const winMode = typeof window !== 'undefined' ? (window as any).__SKILL_VFX_MODE : undefined;
    if (winMode === 'old' || winMode === 'new' || winMode === 'both') return winMode;
    return currentSkillVfxMode;
}

interface DeFlipbookSpec {
    url: string;
    frames: number;
    boxW: number;
    boxH: number;
    anchorX: number;
    anchorY: number;
    screenBlend?: boolean;
}

const DE_FLIPBOOK_SPECS: Record<string, DeFlipbookSpec> = {
    GROUND_STRIKE: {
        url: '/SUCAI_FX/GROUND_STRIKE/fly_0.png',
        frames: 8,
        boxW: 554,
        boxH: 299,
        anchorX: 268,
        anchorY: 162,
        screenBlend: true, // 黑底发光震地裂纹序列帧，用 screen 滤色混合自动去黑底
    },
    EXPLODING_BOLT: {
        url: '/SUCAI_FX/EXPLODING_BOLT/fly_0.png',
        frames: 10,
        boxW: 379,
        boxH: 198,
        anchorX: 190,
        anchorY: 96,
    },
    IMPACT_DUST: {
        url: '/SUCAI_FX/IMPACT_DUST/dir00/fly_0.png',
        frames: 8,
        boxW: 135,
        boxH: 78,
        anchorX: 27,
        anchorY: 39,
    },
    UNIT_DUST: {
        url: '/SUCAI_FX/DUST/UNIT_DUST/fly_0.png',
        frames: 8,
        boxW: 59,
        boxH: 58,
        anchorX: 24,
        anchorY: 28,
    },
    TREBUCHET_SMOKE: {
        url: '/SUCAI_FX/IMPACT_TREBUCHET_SMOKE/fly_0.png',
        frames: 10,
        boxW: 353,
        boxH: 464,
        anchorX: 191,
        anchorY: 252,
    },
    BLOOD: {
        url: '/SUCAI_FX/BLOOD/dir00/fly_0.png',
        frames: 8,
        boxW: 202,
        boxH: 116,
        anchorX: 83,
        anchorY: 56,
    },
};

const flipbookImageCache = new Map<string, HTMLImageElement>();
const flipbookLoading = new Set<string>();

function getFlipbookImage(key: keyof typeof DE_FLIPBOOK_SPECS): HTMLImageElement | null {
    const cached = flipbookImageCache.get(key);
    if (cached) return cached;
    if (typeof Image === 'undefined') return null;
    if (!flipbookLoading.has(key)) {
        flipbookLoading.add(key);
        const spec = DE_FLIPBOOK_SPECS[key];
        const img = new Image();
        img.onload = () => {
            flipbookLoading.delete(key);
            flipbookImageCache.set(key, img);
        };
        img.onerror = () => {
            flipbookLoading.delete(key);
        };
        img.src = spec.url;
    }
    return null;
}

/**
 * 绘制一帧 AoE2 DE 原生 Flipbook 序列帧切片
 */
function drawDeFlipbookFrame(
    ctx: CanvasRenderingContext2D,
    key: keyof typeof DE_FLIPBOOK_SPECS,
    normProgress: number,
    x: number,
    y: number,
    scaleX = 1.0,
    scaleY = scaleX,
    alpha = 1.0,
    flipX = false,
): boolean {
    const spec = DE_FLIPBOOK_SPECS[key];
    const img = getFlipbookImage(key);
    if (!spec || !img || alpha <= 0.01) return false;

    const frameIdx = Math.max(0, Math.min(spec.frames - 1, Math.floor(clamp01(normProgress) * spec.frames)));
    const sx = frameIdx * spec.boxW;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (spec.screenBlend) {
        ctx.globalCompositeOperation = 'screen';
    }
    ctx.translate(x, y);
    ctx.scale(flipX ? -scaleX : scaleX, scaleY);
    ctx.drawImage(
        img,
        sx,
        0,
        spec.boxW,
        spec.boxH,
        -spec.anchorX,
        -spec.anchorY,
        spec.boxW,
        spec.boxH,
    );
    ctx.restore();
    return true;
}

/**
 * 六计专属手绘古战场金石冷兵器透明抠图图标（256×256 统一规格）：
 * - gongzhan (攻战·振己威): 朱砂赤铜鎏金血槽阔剑
 * - shengzhan (胜战·固己防): 古青铜包边苍玉重装塔盾
 * - dizhan (敌战·伏兵偷袭): 雄狮浮雕古铜箍黑牛角战号 + 金色音波
 * - hunzhan (混战·乱敌阵): 青铜残片与暮色紫烟双螺旋迷魂涡流
 * - bingzhan (并战·夺敌兵): 琥珀鎏金与寒铁靛青双回旋箭头环抱青铜虎符
 * - baizhan (败战·减敌兵): 三支俯冲黑羽破甲铁箭携暗殷红血风
 */
const DE_TECH_ICON_URLS: Record<TacticalSixSet, string> = {
    gongzhan: '/SUCAI_FX/SIX_ICONS/gongzhan.png',
    shengzhan: '/SUCAI_FX/SIX_ICONS/shengzhan.png',
    dizhan: '/SUCAI_FX/SIX_ICONS/dizhan.png',
    hunzhan: '/SUCAI_FX/SIX_ICONS/hunzhan.png',
    bingzhan: '/SUCAI_FX/SIX_ICONS/bingzhan.png',
    baizhan: '/SUCAI_FX/SIX_ICONS/baizhan.png',
};

const deTechRawImages = new Map<TacticalSixSet, HTMLImageElement>();
const deTechLoading = new Set<TacticalSixSet>();
const deMedallionCache = new Map<string, HTMLCanvasElement>();

function getDeMedallionBadge(six: TacticalSixSet, paid = false): HTMLCanvasElement | null {
    const cacheKey = `${six}_${paid ? 1 : 0}`;
    const existing = deMedallionCache.get(cacheKey);
    if (existing) return existing;

    const rawImg = deTechRawImages.get(six);
    if (!rawImg) {
        if (typeof Image !== 'undefined' && !deTechLoading.has(six)) {
            deTechLoading.add(six);
            const img = new Image();
            img.onload = () => {
                deTechLoading.delete(six);
                deTechRawImages.set(six, img);
            };
            img.onerror = () => {
                deTechLoading.delete(six);
            };
            img.src = DE_TECH_ICON_URLS[six];
        }
        return null;
    }

    // 预烘焙 128×128 独立镂空剪影图标（无死板圆框裁切，完整保留剑尖、盾角、号角流苏、虎符与三羽箭轮廓）
    const SIZE = 128;
    const PAD = 8;
    const DRAW_S = SIZE - PAD * 2;
    const cv = document.createElement('canvas');
    cv.width = SIZE;
    cv.height = SIZE;
    const g = cv.getContext('2d')!;

    g.save();
    // 1. 底部深邃冷兵器投影，确保在亮黄土地、绿草、雪地与水面上都棱角分明
    g.shadowColor = paid ? 'rgba(255, 196, 72, 0.85)' : 'rgba(8, 6, 4, 0.92)';
    g.shadowBlur = paid ? 10 : 7;
    g.shadowOffsetX = 0;
    g.shadowOffsetY = paid ? 0 : 2.5;
    g.drawImage(rawImg, PAD, PAD, DRAW_S, DRAW_S);

    // 2. 二次叠绘本体增强暗部接触阴影与金属锐度
    g.shadowColor = 'rgba(0, 0, 0, 0.85)';
    g.shadowBlur = 3.5;
    g.shadowOffsetY = 1.5;
    g.drawImage(rawImg, PAD, PAD, DRAW_S, DRAW_S);
    g.restore();

    deMedallionCache.set(cacheKey, cv);
    return cv;
}

/**
 * 新版地面层：采用 DE 原生 `GROUND_STRIKE` 震地裂纹冲击波、`EXPLODING_BOLT` 烈焰环、`IMPACT_DUST` 破土扬尘序列帧
 */
function drawGroundOneDeFlipbook(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const fade = holdFade(p);
    const scale = tierScale(v);
    const x = v.x, y = v.y - lift(v.x, v.y);
    const col = COLOR[v.six];
    const halo = getSoftGroundHalo(col);

    ctx.save();

    // 1. 柔和矿物色地气底晕
    const expandP = clamp01(p * 1.45);
    const e = easeOut(expandP);
    const baseRx = (62 + e * (v.six === 'hunzhan' ? 175 : 205)) * scale;
    const baseRy = baseRx * 0.48;
    ctx.globalAlpha = fade * 0.58;
    drawStamp(ctx, halo, x, y, baseRx, baseRy);

    // 2. DE 原生 GROUND_STRIKE 震地裂纹冲击波（播放两波：主爆发波 + 余震波）
    const strikeP1 = clamp01(p * 1.65);
    if (strikeP1 < 1) {
        drawDeFlipbookFrame(ctx, 'GROUND_STRIKE', strikeP1, x, y, 0.72 * scale, 0.68 * scale, fade * 0.88);
    }
    const strikeP2 = clamp01((p - 0.22) * 1.55);
    if (p >= 0.22 && strikeP2 < 1) {
        drawDeFlipbookFrame(ctx, 'GROUND_STRIKE', strikeP2, x, y, 0.92 * scale, 0.86 * scale, fade * 0.72, true);
    }

    // 3. 各计专属 DE 地面序列帧
    if (v.six === 'gongzhan') {
        // 攻战：阵心与冲锋前锋爆开 EXPLODING_BOLT 炽烈冲击环 + 沿冲锋方向推进的 IMPACT_DUST 铁蹄扬尘
        const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
        const boltP = clamp01(p * 1.5);
        if (boltP < 1) {
            drawDeFlipbookFrame(ctx, 'EXPLODING_BOLT', boltP, x, y, 0.85 * scale, 0.78 * scale, fade * 0.82);
        }
        for (let k = 0; k < 4; k++) {
            const delay = k * 0.12;
            const dp = clamp01((p - delay) / 0.55);
            if (p < delay || dp >= 1) continue;
            const dist = (k * 48 + easeOut(dp) * 42) * scale;
            const gx = x + dx * dist;
            const gy = y + dy * dist * 0.65;
            drawDeFlipbookFrame(ctx, 'IMPACT_DUST', dp, gx, gy, 1.05 * scale, 0.95 * scale, fade * 0.85, k % 2 === 1);
        }
    } else if (v.six === 'shengzhan') {
        // 胜战：8 处重盾顿地激起 8 团真实 IMPACT_DUST 扬尘序列帧
        const rx = (64 + e * 124) * scale;
        const ry = rx * 0.48;
        const dp = clamp01(p * 1.45);
        for (let k = 0; k < 8; k++) {
            const ang = k * (TAU / 8);
            const sx = x + Math.cos(ang) * rx;
            const sy = y + Math.sin(ang) * ry;
            drawDeFlipbookFrame(ctx, 'IMPACT_DUST', dp, sx, sy, 0.85 * scale, 0.80 * scale, fade * 0.80, k % 2 === 0);
        }
    } else if (v.six === 'dizhan') {
        // 敌战：伏兵出兵代表点破土扬起真实 IMPACT_DUST 尘暴
        const totalPts = v.points.length;
        const maxClusters = Math.min(totalPts, 6);
        for (let c = 0; c < maxClusters; c++) {
            const idx = Math.floor((c + 0.5) * totalPts / maxClusters);
            const pt = v.points[idx];
            const py = pt.y - lift(pt.x, pt.y);
            const delay = c * 0.06;
            const dp = clamp01((p - delay) / 0.68);
            if (p >= delay && dp < 1) {
                drawDeFlipbookFrame(ctx, 'IMPACT_DUST', dp, pt.x, py, 1.18 * scale, 1.08 * scale, fade * 0.90, c % 2 === 1);
            }
        }
    } else if (v.six === 'baizhan') {
        // 败战：箭雨落点扬起真实 UNIT_DUST 尘土
        const useTargets = v.targets.length > 0;
        const srcLen = useTargets ? v.targets.length : v.points.length;
        const pn = Math.min(srcLen, 28);
        for (let i = 0; i < pn; i++) {
            const idx = Math.floor(i * srcLen / pn);
            const pt = useTargets ? v.targets[idx] : v.points[idx];
            const py = pt.y - lift(pt.x, pt.y);
            const delay = ((i * 0.618034) % 1) * 0.35;
            const localP = clamp01((p - delay) / (1 - delay));
            if (localP >= 0.28) {
                const ip = clamp01((localP - 0.28) / 0.52);
                if (ip < 1) {
                    drawDeFlipbookFrame(ctx, 'UNIT_DUST', ip, pt.x, py, 1.15 * scale, 1.05 * scale, fade * 0.78, i % 2 === 0);
                }
            }
        }
    }

    ctx.restore();
}

/**
 * 新版上层大场面：用 DE 原生序列帧（EXPLODING_BOLT / TREBUCHET_SMOKE / IMPACT_DUST / BLOOD）＋ DE 官方厚涂油画勋章替代手画简笔画
 */
function drawTopOneDeFlipbook(ctx: CanvasRenderingContext2D, v: Scene13SkillVfx, p: number, lift: Lift): void {
    const expandP = clamp01(p * 1.38);
    const e = easeOut(expandP);
    const fade = holdFade(p);
    const scale = tierScale(v);
    const cx = v.x, cy = v.y - lift(v.x, v.y) - 14;
    const badge = getDeMedallionBadge(v.six, v.paid) ?? getColdWeaponIcon(
        v.six === 'gongzhan' ? 'swords'
            : v.six === 'shengzhan' ? 'shield'
            : v.six === 'dizhan' ? 'banner'
            : v.six === 'hunzhan' ? 'dizzy'
            : v.six === 'bingzhan' ? 'defect'
            : 'slashKill',
        v.paid,
    );

    ctx.save();

    if (v.six === 'gongzhan') {
        // 【攻战·振己威】冲锋前锋 EXPLODING_BOLT 炽烈战气波 + 破阵滚滚烟尘 + 阵心 DE 官方厚涂铁剑勋章
        const dx = Math.cos(v.angle), dy = Math.sin(v.angle);
        const px = -dy, py = dx;
        for (let k = 0; k < 3; k++) {
            const delay = k * 0.14;
            const bp = clamp01((p - delay) / 0.62);
            if (p >= delay && bp < 1) {
                const adv = (32 + k * 52 + easeOut(bp) * 44) * scale;
                const bx = cx + dx * adv;
                const by = cy + dy * adv * 0.65;
                drawDeFlipbookFrame(ctx, 'EXPLODING_BOLT', bp, bx, by, (0.62 + k * 0.12) * scale, (0.52 + k * 0.10) * scale, fade * 0.85);
            }
        }
        // 冲锋队列脚下扬起 UNIT_DUST 疾行尘烟
        for (let i = 0; i < 6; i++) {
            const off = (i - 2.5) * 32 * scale;
            const waveP = (p * 1.6 + (i % 3) * 0.25) % 1;
            const travel = easeOut(waveP) * 110 * scale;
            const sx = cx + px * off + dx * (travel - 40);
            const sy = cy + py * off * 0.6 + dy * (travel - 40) * 0.65;
            drawDeFlipbookFrame(ctx, 'UNIT_DUST', waveP, sx, sy, 1.25 * scale, 1.15 * scale, fade * 0.78, i % 2 === 1);
        }
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, badge, cx, cy - 30 - e * 12 * scale, 38 * scale * pulse);
    } else if (v.six === 'dizhan') {
        // 【敌战·伏兵偷袭】伏兵出兵口腾起 TREBUCHET_SMOKE 与 IMPACT_DUST 漫天黄尘 + DE 征召军令勋章（彻底告别简笔画蓝三角旗）
        const dropOffset = (1 - easeOut(Math.min(1, p * 3.2))) * 36 * scale;
        drawDeFlipbookFrame(ctx, 'IMPACT_DUST', clamp01(p * 1.4), cx, cy + 4, 1.35 * scale, 1.20 * scale, fade * 0.88);
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, badge, cx, cy - 36 * scale - dropOffset, 38 * scale);

        const totalPts = v.points.length;
        const maxClusters = Math.min(totalPts, 6);
        for (let c = 0; c < maxClusters; c++) {
            const idx = Math.floor((c + 0.5) * totalPts / maxClusters);
            const pt = v.points[idx];
            const y = pt.y - lift(pt.x, pt.y);
            const sp = clamp01((p - c * 0.05) * 1.35);
            drawDeFlipbookFrame(ctx, 'TREBUCHET_SMOKE', sp, pt.x, y + 6, 0.42 * scale, 0.38 * scale, fade * 0.72, c % 2 === 1);
            drawDeFlipbookFrame(ctx, 'IMPACT_DUST', sp, pt.x, y + 2, 1.10 * scale, 1.0 * scale, fade * 0.86, c % 2 === 0);
            ctx.globalAlpha = fade * 0.95;
            drawStamp(ctx, badge, pt.x, y - (30 + e * 12) * scale, 23 * scale);
        }
    } else if (v.six === 'shengzhan') {
        // 【胜战·固己防】8 枚 DE 官方厚涂重装钢甲勋章绕阵顿地 + 真实踏阵扬尘 + 温润苍玉回血十字升腾
        const x = v.x, y = v.y - lift(v.x, v.y);
        const rx = (64 + e * 124) * scale;
        const ry = rx * 0.48;
        const slamDrop = (1 - easeOut(Math.min(1, p * 3.5))) * 36 * scale;
        for (let k = 0; k < 8; k++) {
            const ang = k * (TAU / 8) + p * 0.32;
            const sx = x + Math.cos(ang) * rx;
            const sy = y + Math.sin(ang) * ry - 12 * scale - slamDrop;
            ctx.globalAlpha = fade * 0.95;
            drawStamp(ctx, badge, sx, sy, 24 * scale);
        }
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, badge, x, y - 36 * scale - slamDrop, 38 * scale * pulse);

        const plusOffsets = [
            { dx: 0, dy: -0.58, s: 1.40 },
            { dx: -0.46, dy: -0.24, s: 1.12 },
            { dx: 0.46, dy: -0.24, s: 1.12 },
            { dx: -0.28, dy: -0.78, s: 1.02 },
            { dx: 0.28, dy: -0.78, s: 1.02 },
        ];
        for (let i = 0; i < plusOffsets.length; i++) {
            const po = plusOffsets[i];
            const rise = (p * 1.45 + i * 0.16) % 1;
            const px = x + po.dx * rx;
            const py = y + po.dy * ry - 14 * scale - rise * 34 * scale;
            ctx.globalAlpha = fade * (1 - rise * 0.42) * 0.92;
            drawHealPlus(ctx, px, py, 12 * po.s * scale, 4.5 * po.s * scale, COLOR.shengzhan, '#e6f2ea');
        }
    } else if (v.six === 'hunzhan') {
        // 【混战·乱敌阵】6 柱 DE 原生 TREBUCHET_SMOKE 滚滚浓烟与 IMPACT_DUST 席卷敌阵 + DE 纵火勋章
        for (let i = 0; i < 6; i++) {
            const ang = i * (TAU / 6) + p * 1.8;
            const rad = (36 + (i % 2) * 34 + e * 42) * scale;
            const sx = cx + Math.cos(ang) * rad;
            const sy = cy + Math.sin(ang) * rad * 0.52;
            const sp = (p * 1.45 + i * 0.15) % 1;
            drawDeFlipbookFrame(ctx, 'TREBUCHET_SMOKE', sp, sx, sy + 14, 0.52 * scale, 0.46 * scale, fade * 0.78, i % 2 === 1);
            drawDeFlipbookFrame(ctx, 'IMPACT_DUST', sp, sx, sy + 6, 1.15 * scale, 1.05 * scale, fade * 0.82, i % 2 === 0);
        }
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, badge, cx, cy - 26 * scale, 38 * scale * pulse);
    } else if (v.six === 'bingzhan') {
        // 【并战·夺敌兵】DE 救赎天降金光勋章 + 虎符金箭飞入敌阵 + 倒戈兵脚下爆开 GROUND_STRIKE 金色震波
        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = fade * 0.98;
        drawStamp(ctx, badge, cx, cy - 20 * scale, 38 * scale * pulse);

        const n = Math.min(v.targets.length, 16);
        for (let i = 0; i < n; i++) {
            const m = v.targets[Math.floor(i * v.targets.length / n)];
            if (m.hp <= 0) continue;
            const my = m.y - lift(m.x, m.y) - 18;
            const cpx = (cx + m.x) * 0.5;
            const cpy = Math.min(cy, my) - 64 - (i % 3) * 16;

            const t = clamp01(p * 1.65);
            const u = 1 - t;
            const px = u * u * cx + 2 * u * t * cpx + t * t * m.x;
            const py = u * u * cy + 2 * u * t * cpy + t * t * my;
            const tx = 2 * u * (cpx - cx) + 2 * t * (m.x - cpx);
            const ty = 2 * u * (cpy - cy) + 2 * t * (my - cpy);
            const tLen = Math.hypot(tx, ty) || 1;
            const tailX = px - (tx / tLen) * 22;
            const tailY = py - (ty / tLen) * 22;

            ctx.globalAlpha = fade * 0.94;
            drawWarArrow(ctx, tailX, tailY, px, py, 1.25, true);

            if (t >= 0.85 && i % 2 === 0) {
                const hitP = clamp01((p - 0.50) * 2.0);
                drawDeFlipbookFrame(ctx, 'UNIT_DUST', hitP, m.x, my + 18, 1.15 * scale, 1.05 * scale, fade * 0.82, i % 2 === 0);
            }
        }
    } else {
        // 【败战·减敌兵】漫天黑羽箭雨齐射 + 命中敌兵爆开 DE 原生 BLOOD 飙血序列帧 + 插地箭杆留存 + DE 锥子箭勋章
        const useTargets = v.targets.length > 0;
        const srcLen = useTargets ? v.targets.length : v.points.length;
        const n = Math.min(srcLen, 64);
        const unitScale = v.paid ? 1.26 : 1.12;
        const uFallX = -96 * unitScale;
        const uFallY = -240 * unitScale;

        for (let k = 0; k < 44; k++) {
            const delay = ((k * 0.381966) % 1) * 0.52;
            if (p < delay) continue;
            const lp = clamp01((p - delay) / 0.36);
            const ang = k * 2.39996;
            const rad = Math.sqrt((k + 0.5) / 44) * 185 * scale;
            const tx = cx + Math.cos(ang) * rad;
            const ty = cy + Math.sin(ang) * rad * 0.5;
            if (lp < 1) {
                const tipX = tx + uFallX * (1 - lp);
                const tipY = ty + uFallY * (1 - lp);
                ctx.globalAlpha = fade * 0.90;
                drawWarArrow(ctx, tipX + uFallX * 0.16, tipY + uFallY * 0.16, tipX, tipY, 1.25 * scale, v.paid);
            } else {
                ctx.globalAlpha = fade * 0.72;
                drawWarArrow(ctx, tx + uFallX * 0.11, ty + uFallY * 0.11, tx, ty, 1.04 * scale, v.paid);
            }
        }

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
                ctx.globalAlpha = (0.72 + fp * 0.26) * fade;
                drawWarArrow(ctx, hx + uFallX * 0.18, hy + uFallY * 0.18, hx, hy, 1.30 * unitScale, v.paid);
            } else {
                const ip = (localP - fallFrac) / (1 - fallFrac);
                // 命中飙起 DE 原生 BLOOD 8 帧溅血序列帧（替代手画红色 ✕ 贴纸）
                if (ip < 0.72 && i % 2 === 0) {
                    drawDeFlipbookFrame(
                        ctx,
                        'BLOOD',
                        clamp01(ip / 0.72),
                        pt.x,
                        py - 6,
                        0.48 * unitScale,
                        0.48 * unitScale,
                        fade * 0.90,
                        i % 4 === 0,
                    );
                }
                ctx.globalAlpha = fade * 0.90;
                drawWarArrow(ctx, pt.x + uFallX * 0.13, py + 4 + uFallY * 0.13, pt.x, py + 4, 1.14 * unitScale, v.paid);
            }
        }

        const pulse = 1 + 0.06 * Math.sin(p * Math.PI * 6);
        ctx.globalAlpha = fade * 0.96;
        drawStamp(ctx, badge, cx, cy - 32 * scale, 36 * scale * pulse);
    }

    drawPatronBurst(ctx, v, p, lift);
    ctx.restore();
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
    const mode = getActiveSkillVfxMode();
    ctx.save();
    for (const v of effects) {
        registerSkillCastMeta(v, nowSec);
        const p = clamp01((nowMs - v.startMs) / (v.dur * 1000));
        if (p >= 1) continue;
        if (mode === 'old' || mode === 'both') {
            ctx.save();
            if (layer === 'ground') drawGroundOne(ctx, v, p, lift);
            else drawTopOne(ctx, v, p, lift);
            ctx.restore();
        }
        if (mode === 'new' || mode === 'both') {
            ctx.save();
            if (layer === 'ground') drawGroundOneDeFlipbook(ctx, v, p, lift);
            else drawTopOneDeFlipbook(ctx, v, p, lift);
            ctx.restore();
        }
    }
    ctx.restore();
}

// ── 6. 持续阶段的单兵小特效（彻底去掉脚下重叠的「弹簧圈」；头顶图标疏朗抽样，每 5 名士兵/主将显示 1 枚） ──
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

    const mode = getActiveSkillVfxMode();
    const useNewBadge = mode === 'new' || mode === 'both';

    ctx.save();
    ctx.lineCap = 'round';

    const swordsStd = (useNewBadge && getDeMedallionBadge('gongzhan', false)) || getColdWeaponIcon('swords', false);
    const swordsPaid = (useNewBadge && getDeMedallionBadge('gongzhan', true)) || getColdWeaponIcon('swords', true);
    const shieldStd = (useNewBadge && getDeMedallionBadge('shengzhan', false)) || getColdWeaponIcon('shield', false);
    const shieldPaid = (useNewBadge && getDeMedallionBadge('shengzhan', true)) || getColdWeaponIcon('shield', true);
    const bannerStd = (useNewBadge && getDeMedallionBadge('dizhan', false)) || getColdWeaponIcon('banner', false);
    const bannerPaid = (useNewBadge && getDeMedallionBadge('dizhan', true)) || getColdWeaponIcon('banner', true);
    const dizzyStd = (useNewBadge && getDeMedallionBadge('hunzhan', false)) || getColdWeaponIcon('dizzy', false);
    const dizzyPaid = (useNewBadge && getDeMedallionBadge('hunzhan', true)) || getColdWeaponIcon('dizzy', true);
    const defectStd = (useNewBadge && getDeMedallionBadge('bingzhan', false)) || getColdWeaponIcon('defect', false);

    const ICON_R = 12.0;

    for (const m of men) {
        if (m.hp <= 0) continue;
        // 疏朗抽样：仅主将或每 5 名士兵中的什伍长代表（m.zid % 5 === 0）显示头顶状态图标，不遮挡密集兵模阵列
        if (!m.hero && (m.zid % 5) !== 0) continue;

        const st = unitStateOf ? unitStateOf(m) : states[m.f];
        const tier = sideCastTier[m.f];
        const y = m.y - lift(m.x, m.y);
        const pulse = 0.5 + 0.5 * Math.sin(nowSec * 5.8 + m.zid * 0.73);
        const iconR = m.hero ? ICON_R * 1.25 : ICON_R;

        // 【攻】振己威持续期：头顶疏朗图标（无脚下弹簧圈）
        if (st.frenzy > 0 && !m.siegeW) {
            const fadeOut = clamp01(st.frenzy / 0.8);
            const hy = y - 27 - pulse * 2.5;
            ctx.globalAlpha = (0.88 + pulse * 0.12) * fadeOut;
            drawStamp(ctx, tier.frenzyPaid ? swordsPaid : swordsStd, m.x, hy, iconR);
        }

        // 【胜】固己防持续期：头顶疏朗重甲/重盾勋章（前 2.4 秒伴随飘升苍玉 + 号）
        if (st.shield > 0 && !m.siegeW) {
            const fadeOut = clamp01(st.shield / 0.8);
            const hy = y - 27 - pulse * 2.0;
            ctx.globalAlpha = (0.90 + pulse * 0.10) * fadeOut;
            drawStamp(ctx, tier.shieldPaid ? shieldPaid : shieldStd, m.x, hy, iconR);

            const sinceCast = Math.max(0, nowSec - tier.shieldCastSec);
            if (sinceCast < 2.4) {
                const hpP = sinceCast / 2.4;
                const hpFade = hpP < 0.65 ? 1 : (1 - hpP) / 0.35;
                ctx.globalAlpha = hpFade * fadeOut * 0.92;
                drawHealPlus(ctx, m.x + 12, hy - hpP * 11, 6.5, 2.8, COLOR.shengzhan, '#e6f2ea');
            }
        }

        // 【混】乱敌阵持续期：头顶疏朗勋章（旧版螺旋旋转，新版厚涂火把勋章脉冲微晃）
        if (st.panic > 0 && !m.march && !m.hero && !m.siegeW) {
            const fadeOut = clamp01(st.panic / 0.8);
            const hy = y - 27;
            ctx.save();
            ctx.translate(m.x, hy);
            ctx.rotate(useNewBadge ? Math.sin(nowSec * 6.5 + m.zid) * 0.18 : (nowSec * 3.8 + m.zid));
            ctx.globalAlpha = (0.88 + pulse * 0.12) * fadeOut;
            drawStamp(ctx, tier.panicPaid ? dizzyPaid : dizzyStd, 0, 0, iconR);
            ctx.restore();
        }

        // 【敌】伏兵生力军 & 【并】倒戈兵
        if (hasUnitTags) {
            const tag = unitSkillTags.get(m);
            if (tag && nowSec < tag.untilSec) {
                const rem = clamp01((tag.untilSec - nowSec) / 1.0);
                const hy = y - 27 - pulse * 2.0;
                ctx.globalAlpha = (0.90 + pulse * 0.10) * rem;
                if (tag.six === 'dizhan') {
                    drawStamp(ctx, tag.paid ? bannerPaid : bannerStd, m.x, hy, iconR);
                } else {
                    drawStamp(ctx, defectStd, m.x, hy, iconR);
                }
            }
        }
    }
    ctx.restore();
}
