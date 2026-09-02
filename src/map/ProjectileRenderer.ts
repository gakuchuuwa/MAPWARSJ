import L from 'leaflet';
import { NavalFxSprites, NAVAL_FX, type NavalFxName } from './NavalFxSprites';

/**
 * 投射物接口
 */
interface Projectile {
    id: string; // Unique ID
    start: L.LatLng; // 起点
    end: L.LatLng; // 终点
    progress: number; // 0.0 -> 1.0
    speed: number; // 速度 (progress per second)
    maxHeight: number; // 抛物线最高点 (Visual scale)
    type: 'arrow' | 'stone' | 'fire' | 'cannon';
    /**
     * 海上发射：命中点在水面，落点要砸出水花；炮弹还要在起点点一团炮口焰。
     * 🔴 陆战攻城的投石机也走 'stone'（GlobalUnitRenderer 的 isSiegeAttacker 分支），
     *    落点在城墙上 —— 那种绝不能溅水，所以水花认这个标志，不认弹种。
     */
    naval: boolean;
}

/**
 * 一次海战特效播放（炮口焰 / 落水水花），帧来自 DE 本体素材。
 */
interface NavalFx {
    id: string;
    name: NavalFxName;
    pos: L.LatLng;
    progress: number; // 0.0 -> 1.0
    speed: number; // 速度 (progress per second)
    /**
     * 炮口焰要按开火方位角转；朝向存的是「瞄准点」而不是算好的弧度 ——
     * 角度必须在屏幕坐标系里算（墨卡托下纬度是非线性的，直接拿经纬差算高纬度会偏）。
     * 水花不需要转向，传 null。
     */
    aim: L.LatLng | null;
}

/**
 * ProjectileRenderer
 * 负责绘制和更新所有飞行道具（箭矢、炮弹、石弹）及其开炮火光与落水击中特效。
 * 这是一个纯视觉系统，不涉及伤害计算。
 */
export class ProjectileRenderer {
    private projectiles: Projectile[] = [];
    private navalFx: NavalFx[] = [];
    private lastTime: number = 0;
    private map: L.Map;

    constructor(map: L.Map) {
        this.map = map;
    }

    public hasActive(): boolean {
        return this.projectiles.length > 0 || this.navalFx.length > 0;
    }

    /**
     * 发射投射物
     * @param start 起点坐标
     * @param end 终点坐标
     * @param duration 飞行时间 (毫秒)，默认 800ms
     */
    public spawn(
        start: L.LatLng,
        end: L.LatLng,
        duration: number = 800,
        type: Projectile['type'] = 'arrow',
        naval = false,
    ): void {
        const id = Math.random().toString(36).substr(2, 9);
        const speed = 1000 / duration;

        this.projectiles.push({
            id,
            start,
            end,
            progress: 0,
            speed,
            maxHeight: 0,
            type,
            naval,
        });

        // 开炮瞬间在船位点一团 DE 炮口焰：橙红火光一闪 → 米白硝烟膨胀上飘（约 1 秒）
        if (naval && type === 'cannon') {
            this.pushFx('CANNON_MUZZLE', start, end);
        }
    }

    /** 起一次海战特效。aim 给了就按「pos → aim」的屏幕方位角转向。 */
    private pushFx(name: NavalFxName, pos: L.LatLng, aim: L.LatLng | null = null): void {
        this.navalFx.push({
            id: Math.random().toString(36).substr(2, 9),
            name,
            pos,
            progress: 0,
            speed: 1000 / NAVAL_FX[name].durationMs,
            aim,
        });
    }

    /**
     * 齐射：多支箭矢平行散开，带 ripple 延迟（军团 / 据点共用）
     */
    public spawnVolley(
        baseStart: L.LatLng,
        baseEnd: L.LatLng,
        options?: {
            count?: number;
            spreadFactor?: number;
            staggerMs?: number;
            durationMs?: number;
            type?: Projectile['type'];
            /** 海上齐射：落点在水面，要出水花 / 炮口焰 */
            naval?: boolean;
        }
    ): void {
        // 海战特效图集按需加载：不在开机预载（预载素材是本项目历史上的卡顿根因），
        // 第一次真打海战时才拉，两张图集合计约 1.8MB 解码。
        if (options?.naval) NavalFxSprites.preload();

        const count = options?.count ?? 5;
        const spreadFactor = options?.spreadFactor ?? 0.025;
        const staggerMs = options?.staggerMs ?? 80;
        const durationMs = options?.durationMs ?? 420;

        const dx = baseEnd.lng - baseStart.lng;
        const dy = baseEnd.lat - baseStart.lat;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len < 1e-9) return;

        const pxFinal = (dx / len) * spreadFactor;
        const pyFinal = -(dy / len) * spreadFactor;

        for (let k = 0; k < count; k++) {
            const offset = k - (count - 1) / 2;
            const s = L.latLng(
                baseStart.lat + pxFinal * offset,
                baseStart.lng + pyFinal * offset
            );
            const e = L.latLng(
                baseEnd.lat + pxFinal * offset,
                baseEnd.lng + pyFinal * offset
            );
            const staggerDelay = k * staggerMs + Math.random() * 30;
            setTimeout(() => {
                this.spawn(s, e, durationMs + Math.random() * 50, options?.type ?? 'arrow', options?.naval ?? false);
            }, staggerDelay);
        }
    }

    public update(dt: number): void {
        const finished: string[] = [];

        for (const p of this.projectiles) {
            p.progress += (p.speed * dt) / 1000;
            if (p.progress >= 1.0) {
                finished.push(p.id);
                // 炮弹 / 石弹砸进海里 → DE 的落水水花。只认 naval 标志：
                // 攻城战投石机同样走 'stone'，落点在城墙上，绝不能溅水。
                if (p.naval && (p.type === 'cannon' || p.type === 'stone')) {
                    this.pushFx('WATER_SPLASH', p.end);
                }
            }
        }

        if (finished.length > 0) {
            this.projectiles = this.projectiles.filter(p => !finished.includes(p.id));
        }

        let fxDone = false;
        for (const fx of this.navalFx) {
            fx.progress += (fx.speed * dt) / 1000;
            if (fx.progress >= 1.0) fxDone = true;
        }
        if (fxDone) this.navalFx = this.navalFx.filter(fx => fx.progress < 1.0);
    }

    public draw(ctx: CanvasRenderingContext2D, currentScale: number): void {
        if (this.projectiles.length === 0 && this.navalFx.length === 0) return;

        // 1. 海战特效（DE 本体帧）：炮口焰画在开炮的船上，水花画在落点。
        //    先画特效再画投射物，硝烟才不会盖住正在飞的弹丸。
        for (const fx of this.navalFx) {
            const pt = this.map.latLngToContainerPoint(fx.pos);
            let rotation = 0;
            if (fx.aim) {
                const aimPt = this.map.latLngToContainerPoint(fx.aim);
                rotation = Math.atan2(aimPt.y - pt.y, aimPt.x - pt.x);
            }
            NavalFxSprites.draw(ctx, fx.name, pt.x, pt.y, fx.progress, currentScale, rotation);
        }

        // 2. 绘制飞行道具（箭矢/炮弹/火箭/石弹）
        if (this.projectiles.length === 0) return;

        ctx.save();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';

        // 箭矢颜色 - 稍微深一点的木色/黑色
        const arrowColor = '#2c3e50';
        const arrowHeadColor = '#95a5a6';

        for (const p of this.projectiles) {
            const startPt = this.map.latLngToContainerPoint(p.start);
            const endPt = this.map.latLngToContainerPoint(p.end);

            // 抛物线插值
            // Linear position
            const x = startPt.x + (endPt.x - startPt.x) * p.progress;
            const y = startPt.y + (endPt.y - startPt.y) * p.progress;

            // Parabolic Height (Arc)
            // h(t) = 4 * H * t * (1-t)
            // Visual Height depends on distance usually.
            const dx = endPt.x - startPt.x;
            const dy = endPt.y - startPt.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const arcHeight = Math.min(dist * 0.3, 100); // 30% of distance or max 100px

            const visualZ = 4 * arcHeight * p.progress * (1 - p.progress);

            // Apply height to Y (Screen Y is down, so minus Z goes up)
            const drawY = y - visualZ;
            const drawX = x;

            // Calculate Angle for rotation
            // We need tangent of the arc.
            // Pos P(t) = L(t) - V(t)*Up
            // dP/dt = dL/dt - dV/dt * Up
            // dL/dt = (end - start)
            // dV/dt = 4*H * (1 - 2t)

            const vx = (endPt.x - startPt.x);
            const vy = (endPt.y - startPt.y); // Linear velocity Y
            const vz_visual = - (4 * arcHeight * (1 - 2 * p.progress)); // Upward velocity component (in screen Y specific)

            // Final velocity vector
            const dirX = vx;
            const dirY = vy + vz_visual;

            const angle = Math.atan2(dirY, dirX);

            // Draw based on type
            ctx.translate(drawX, drawY);
            ctx.rotate(angle);

            if (p.type === 'stone') {
                // 石弹：灰色填充圆
                const r = 3.5 * currentScale;
                ctx.fillStyle = '#7a7a7a';
                ctx.beginPath();
                ctx.arc(0, 0, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#4a4a4a';
                ctx.lineWidth = 1 * currentScale;
                ctx.stroke();
            } else if (p.type === 'fire') {
                // 火箭（2026-07-18 主人定：据点守军齐射）：焦木杆 + 三层火焰头 + 光晕，随进度闪烁
                const s = currentScale;
                const flicker = 1 + 0.25 * Math.sin(p.progress * 30 + p.id.charCodeAt(0));

                // 焦木杆
                ctx.strokeStyle = '#5a3a1a';
                ctx.lineWidth = 1.5 * s;
                ctx.beginPath();
                ctx.moveTo(-11 * s, 0);
                ctx.lineTo(4 * s, 0);
                ctx.stroke();

                // 光晕
                ctx.fillStyle = 'rgba(255, 110, 20, 0.35)';
                ctx.beginPath();
                ctx.arc(5 * s, 0, 6 * s * flicker, 0, Math.PI * 2);
                ctx.fill();
                // 外焰（橙）
                ctx.fillStyle = '#ff6a00';
                ctx.beginPath();
                ctx.arc(5.5 * s, 0, 3.2 * s * flicker, 0, Math.PI * 2);
                ctx.fill();
                // 内焰（黄白核心）
                ctx.fillStyle = '#ffd54a';
                ctx.beginPath();
                ctx.arc(6.2 * s, 0, 1.6 * s * flicker, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'cannon') {
                // 炮弹（2026-08-30 海战演出）：黑色实心弹丸 + 尾烟拖影，命中即落水溅花
                const s = currentScale;
                // 尾烟：沿飞行反方向排 3 团渐淡灰烟
                for (let i = 1; i <= 3; i++) {
                    const fade = (1 - i / 4) * 0.5;
                    ctx.fillStyle = `rgba(120, 120, 125, ${fade})`;
                    ctx.beginPath();
                    ctx.arc(-i * 5 * s, 0, (4.5 - i * 0.8) * s, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 弹丸：深铁黑 + 顶部高光
                ctx.fillStyle = '#1c1c1e';
                ctx.beginPath();
                ctx.arc(0, 0, 3.2 * s, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
                ctx.beginPath();
                ctx.arc(-0.8 * s, -0.8 * s, 1.1 * s, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Arrow: shaft + head + fletching
                ctx.strokeStyle = arrowColor;
                ctx.lineWidth = 1.5 * currentScale;
                ctx.beginPath();
                ctx.moveTo(-12 * currentScale, 0);
                ctx.lineTo(6 * currentScale, 0);
                ctx.stroke();

                ctx.fillStyle = arrowHeadColor;
                ctx.beginPath();
                ctx.moveTo(6 * currentScale, 0);
                ctx.lineTo(3 * currentScale, -2.5 * currentScale);
                ctx.lineTo(3 * currentScale, 2.5 * currentScale);
                ctx.closePath();
                ctx.fill();

                ctx.strokeStyle = '#8b4513';
                ctx.lineWidth = 1 * currentScale;
                ctx.beginPath();
                ctx.moveTo(-12 * currentScale, 0);
                ctx.lineTo(-15 * currentScale, -3 * currentScale);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(-12 * currentScale, 0);
                ctx.lineTo(-15 * currentScale, 3 * currentScale);
                ctx.stroke();
            }

            ctx.rotate(-angle);
            ctx.translate(-drawX, -drawY);
        }

        ctx.restore();
    }
}
