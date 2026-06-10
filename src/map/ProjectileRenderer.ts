import L from 'leaflet';
import { GameMap } from './GameMap';

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
    type: 'arrow' | 'stone' | 'fire';
}

/**
 * ProjectileRenderer
 * 负责绘制和更新所有飞行道具（箭矢）。
 * 这是一个纯视觉系统，不涉及伤害计算。
 */
export class ProjectileRenderer {
    private projectiles: Projectile[] = [];
    private lastTime: number = 0;
    private map: L.Map;

    constructor(map: L.Map) {
        this.map = map;
    }

    public hasActive(): boolean {
        return this.projectiles.length > 0;
    }

    /**
     * 发射投射物
     * @param start 起点坐标
     * @param end 终点坐标
     * @param duration 飞行时间 (毫秒)，默认 800ms
     */
    public spawn(start: L.LatLng, end: L.LatLng, duration: number = 800): void {
        const id = Math.random().toString(36).substr(2, 9);
        const speed = 1000 / duration;

        this.projectiles.push({
            id,
            start,
            end,
            progress: 0,
            speed,
            maxHeight: 0,
            type: 'arrow'
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
        }
    ): void {
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
                this.spawn(s, e, durationMs + Math.random() * 50);
            }, staggerDelay);
        }
    }

    public update(dt: number): void {
        const finished: string[] = [];

        for (const p of this.projectiles) {
            p.progress += (p.speed * dt) / 1000;
            if (p.progress >= 1.0) {
                // p.progress = 1.0;
                finished.push(p.id);
            }
        }

        // Remove finished
        if (finished.length > 0) {
            this.projectiles = this.projectiles.filter(p => !finished.includes(p.id));
        }
    }

    public draw(ctx: CanvasRenderingContext2D, currentScale: number): void {
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

            // Draw Arrow
            ctx.translate(drawX, drawY);
            ctx.rotate(angle);

            // Shaft (longer for visibility)
            ctx.strokeStyle = arrowColor;
            ctx.lineWidth = 1.5 * currentScale;
            ctx.beginPath();
            ctx.moveTo(-12 * currentScale, 0);
            ctx.lineTo(6 * currentScale, 0);
            ctx.stroke();

            // Head (Filled triangle for better visibility)
            ctx.fillStyle = arrowHeadColor;
            ctx.beginPath();
            ctx.moveTo(6 * currentScale, 0);
            ctx.lineTo(3 * currentScale, -2.5 * currentScale);
            ctx.lineTo(3 * currentScale, 2.5 * currentScale);
            ctx.closePath();
            ctx.fill();

            // [NEW] Fletching (Tail feathers) - Makes direction VERY clear
            ctx.strokeStyle = '#8b4513'; // Brown feather color
            ctx.lineWidth = 1 * currentScale;
            // Upper feather
            ctx.beginPath();
            ctx.moveTo(-12 * currentScale, 0);
            ctx.lineTo(-15 * currentScale, -3 * currentScale);
            ctx.stroke();
            // Lower feather
            ctx.beginPath();
            ctx.moveTo(-12 * currentScale, 0);
            ctx.lineTo(-15 * currentScale, 3 * currentScale);
            ctx.stroke();

            ctx.rotate(-angle);
            ctx.translate(-drawX, -drawY);
        }

        ctx.restore();
    }
}
