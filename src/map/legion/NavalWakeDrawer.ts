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
interface FleetWake {
    particles: Particle[]; lastEmission: number; lastSeen: number;
    /** 每条船上一次发射时的世界坐标（按 ships 数组下标），用来算这条船实际往哪走 */
    lastPos: Map<number, Point>;
}

/** DE 原始 DDS 解包贴图和 Once 粒子寿命；发射间隔为本项目渲染采样参数。 */
export class NavalWakeDrawer {
    private static assets: Record<'back' | 'front', Asset> | null = null;
    private static images: Partial<Record<'back' | 'front', HTMLImageElement>> = {};
    private static loading = false;
    private static fleets = new Map<string, FleetWake>();
    private static readonly EMISSION_MS = 125;
    /**
     * 🔴 [2026-09-28 主人「船头和船尾的浪花是不是应该在一条线上？现在有的时候不在一条线」]
     *    船身画出来的朝向（限速转向、僚舰随旗舰）与实际行进方向偏差超过这个角度时，**只发船尾、不发船头**：
     *    浪花会留在水面上 1.25~2 秒，船身斜着滑行时船头那串和船尾那串会变成两条错开的平行线。
     *    直线航行两样照发（DE 原版就是船头浪花 + 船尾尾迹一对）。
     */
    private static readonly BOW_ALIGN_MAX_DEG = 15;
    /** 两次发射间位移小于这么多像素 → 行进方向算不准，不做判定（照发船头） */
    private static readonly BOW_ALIGN_MIN_MOVE_PX = 1.5;
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
            fleet = { particles: [], lastEmission: -Infinity, lastSeen: tick, lastPos: new Map() };
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
                const shipIdx = ships.indexOf(ship);
                const dir = ((Math.round(ship.dir ?? direction) % 16) + 16) % 16;
                // 船身精确罗盘角（0=北，顺时针）：只用于下面「实际行进方向」的偏差判定
                const compassDeg = ship.deg !== undefined ? ship.deg : (45 + 22.5 * dir);
                const rot = ship.rot ?? 0;

                // 🔴 [2026-09-30 主人报「船在行驶的时候，船头浪花和船尾浪花对不齐」] 发射点按**船身的画法**算：
                //    船身 = 离散 16 向帧（该向罗盘角 45+22.5×dir）绕热点再旋转残差角 rot（LegionPhalanxDrawer.drawNaval）。
                //    所以船头/船尾 = 该向在 2:1 等距下的船轴向量（竖向 = 横向 × 0.5），再旋转同一个 rot，以热点为中心对称。
                //    旧写法两处与船身不一致（实测 scratch/terrain_ab/hull_tips.py、wake_sheet.py）：
                //      ① 竖向偏移 yPitch 船头 +0.05 船长、船尾 −0.05 船长 —— 南北向恰好凑对，东西向却变成船头低、船尾高
                //         （8 种船实测东西向两端吃水线差 −0.18 ~ +0.03 船长，旧公式预测 +0.10，方向都反了；新模型 0）；
                //      ② 用连续航向角套椭圆，而船身是「离散帧 + 旋转」，南北向附近两者能差约 10°。
                // 优先使用该舰自身的真实船长（不同船型按各自尺寸定发射点）
                const currentLen = ship.shipLen ?? (shipLength / 1.15);
                const Rx = currentLen * 0.48;
                const dirRad = (45 + 22.5 * dir) * Math.PI / 180;
                const axX0 = Math.sin(dirRad) * Rx, axY0 = -Math.cos(dirRad) * Rx * 0.5;
                const cosR = Math.cos(rot), sinR = Math.sin(rot);
                const axX = axX0 * cosR - axY0 * sinR;   // 与 ctx.rotate(rot) 同向（屏幕坐标 y 向下，顺时针为正）
                const axY = axX0 * sinR + axY0 * cosR;

                // 实际行进方向（屏幕罗盘角，0=上、顺时针）：上次发射时的位置投影到当前屏幕，与现在的位置比
                let emitBow = true;
                const prevWorld = fleet.lastPos.get(shipIdx);
                if (prevWorld) {
                    const prev = projection?.toScreen(prevWorld) ?? prevWorld;
                    const mx = ship.x - prev.x, my = ship.y - prev.y;
                    if (Math.hypot(mx, my) >= this.BOW_ALIGN_MIN_MOVE_PX) {
                        const travelDeg = Math.atan2(mx, -my) * 180 / Math.PI;
                        const diff = Math.abs(((travelDeg - compassDeg) % 360 + 540) % 360 - 180);
                        if (diff > this.BOW_ALIGN_MAX_DEG) emitBow = false;
                    }
                }
                fleet.lastPos.set(shipIdx, projection?.toWorld({ x: ship.x, y: ship.y }) ?? { x: ship.x, y: ship.y });

                for (const kind of ['back', 'front'] as const) {
                    if (kind === 'front' && !emitBow) continue;
                    const profile = this.assets[kind].profiles[ship.r === frontRank ? 'medium' : 'small'];
                    const sign = kind === 'back' ? -1 : 1;
                    const screen = { x: ship.x + axX * sign, y: ship.y + axY * sign };
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
