type Point = { x: number; y: number };
/** 水迹在世界坐标中保存，地图移动或缩放后重新投影。 */
export interface WakeProjection {
    toWorld(point: Point): Point;
    toScreen(point: Point): Point;
}
interface Profile {
    AlphaStart: number; AlphaEnd: number; Scale: number;
    Duration1: number; Duration2: number; StartDuration: number; StopDuration: number;
}
interface Asset {
    width: number; height: number; frames: number; directions: number;
    profiles: Record<'small' | 'medium' | 'large', Profile>;
}
interface Particle {
    position: Point; direction: number; born: number; duration: number;
    kind: 'back' | 'front'; profile: Profile;
    rot?: number;
}
interface FleetWake { particles: Particle[]; lastEmission: number; lastSeen: number; }

/** DE 原始 DDS 解包贴图和 Once 粒子寿命；发射间隔为本项目渲染采样参数。 */
export class NavalWakeDrawer {
    private static assets: Record<'back' | 'front', Asset> | null = null;
    private static images: Partial<Record<'back' | 'front', HTMLImageElement>> = {};
    private static loading = false;
    private static fleets = new Map<string, FleetWake>();
    private static readonly EMISSION_MS = 125;
    private static lastCleanup = 0;

    public static ensureLoaded(): void {
        if (this.loading || this.assets) return;
        this.loading = true;
        const base = '/SUCAI_FX/DE_NAVAL_WAKE/';
        const loadImage = (kind: 'back' | 'front') => new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => { this.images[kind] = img; resolve(); };
            img.onerror = reject;
            img.src = `${base}wake_${kind}.png`;
        });
        void Promise.all([
            fetch(`${base}profiles.json`).then(res => {
                if (!res.ok) throw new Error('DE wake profiles unavailable');
                return res.json();
            }), loadImage('back'), loadImage('front'),
        ]).then(([assets]) => { this.assets = assets; }).catch(error => {
            console.error('[NavalWakeDrawer] DE 水迹加载失败', error);
        });
    }

    public static drawNavalWakes(
        ctx: CanvasRenderingContext2D,
        ships: (Point & { r: number; isAlive: boolean; dir?: number; rot?: number; deg?: number; shipLen?: number })[],
        direction: number, scale: number, tick: number, isMoving: boolean,
        _trail?: Point[], shipLength = 60, unitId = '', projection?: WakeProjection,
    ): void {
        this.ensureLoaded();
        if (!this.assets || !unitId) return;
        if (tick - this.lastCleanup > 2000) {
            for (const [id, state] of this.fleets) {
                if (tick - state.lastSeen > 2000) this.fleets.delete(id);
            }
            this.lastCleanup = tick;
        }
        let fleet = this.fleets.get(unitId);
        if (!fleet || tick < fleet.lastSeen) {
            fleet = { particles: [], lastEmission: -Infinity, lastSeen: tick };
            this.fleets.set(unitId, fleet);
        }
        fleet.lastSeen = tick;
        fleet.particles = fleet.particles.filter(p => tick - p.born < p.duration);
        // 停船只停止发射，水面上已有的粒子继续完成淡出。
        if (isMoving && tick - fleet.lastEmission >= this.EMISSION_MS) {
            fleet.lastEmission = tick;
            const alive = ships.filter(ship => ship.isAlive);
            const frontRank = Math.max(...alive.map(ship => ship.r));
            for (const ship of alive) {
                const dir = ((Math.round(ship.dir ?? direction) % 16) + 16) % 16;
                // 船身精确罗盘角（0=北，顺时针）：优先使用连续航向角，避免离散 22.5° 台阶跳
                const compassDeg = ship.deg !== undefined ? ship.deg : (45 + 22.5 * dir);
                const compassRad = compassDeg * Math.PI / 180;
                const rot = ship.rot ?? 0;

                // 2:1 等轴测视角下的船体几何长轴与短轴：
                // 优先使用该舰自身的真实物理船长（不同船型按各自尺寸定发射点：巨舰、中小舰、小艇各得其所）
                const currentLen = ship.shipLen ?? (shipLength / 1.15);
                const sternRad = compassRad + Math.PI;
                const bowRad = compassRad;
                const Rx = currentLen * 0.48;
                const Ry = currentLen * 0.30;
                const yPitch = -currentLen * 0.05;

                for (const kind of ['back', 'front'] as const) {
                    const profile = this.assets[kind].profiles[ship.r === frontRank ? 'medium' : 'small'];
                    const targetRad = kind === 'back' ? sternRad : bowRad;
                    const screen = {
                        x: ship.x + Math.sin(targetRad) * Rx,
                        y: ship.y - Math.cos(targetRad) * Ry + (kind === 'back' ? yPitch : -yPitch),
                    };
                    fleet.particles.push({
                        position: projection?.toWorld(screen) ?? screen,
                        // 🔴 [2026-09-12 主人报障「船尾水波不对」] 水迹贴图的行号按 DE 素材相位差补偿 −2：(shipDir + 14) % 16
                        direction: (dir + 14) % 16,
                        rot,
                        born: tick,
                        duration: 1000 * (profile.Duration1 + Math.random() * (profile.Duration2 - profile.Duration1)),
                        kind, profile,
                    });
                }
            }
        }
        ctx.save();
        const opacity = ctx.globalAlpha;
        for (const particle of fleet.particles) {
            const age = tick - particle.born;
            const progress = Math.max(0, Math.min(1, age / particle.duration));
            const profile = particle.profile;
            const fadeIn = Math.min(1, age / (profile.StartDuration * 1000));
            const fadeOut = Math.min(1, (particle.duration - age) / (profile.StopDuration * 1000));
            ctx.globalAlpha = opacity * (profile.AlphaStart + (profile.AlphaEnd - profile.AlphaStart) * progress) * fadeIn * fadeOut;
            const asset = this.assets[particle.kind];
            const frame = Math.min(asset.frames - 1, Math.floor(progress * asset.frames));
            const point = projection?.toScreen(particle.position) ?? particle.position;
            const size = scale * profile.Scale;
            const w = asset.width * size, h = asset.height * size;
            // 🔴 叠加粒子发射时的船身残差微旋（rot），使浪花对称轴与船体中轴线 100% 严丝合缝
            if (particle.rot && Math.abs(particle.rot) > 0.001) {
                ctx.save();
                ctx.translate(point.x, point.y);
                ctx.rotate(particle.rot);
                ctx.drawImage(this.images[particle.kind]!, frame * asset.width, particle.direction * asset.height,
                    asset.width, asset.height, -w / 2, -h / 2, w, h);
                ctx.restore();
            } else {
                ctx.drawImage(this.images[particle.kind]!, frame * asset.width, particle.direction * asset.height,
                    asset.width, asset.height, point.x - w / 2, point.y - h / 2, w, h);
            }
        }
        ctx.restore();
    }
}
