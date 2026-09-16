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
        ships: (Point & { r: number; isAlive: boolean; dir?: number })[],
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
                const angle = (dir + 2) * Math.PI / 8;
                for (const kind of ['back', 'front'] as const) {
                    const profile = this.assets[kind].profiles[ship.r === frontRank ? 'medium' : 'small'];
                    const offset = shipLength * (kind === 'front' ? 0.20 : -0.22);
                    const screen = { x: ship.x + Math.sin(angle) * offset, y: ship.y - Math.cos(angle) * offset };
                    fleet.particles.push({
                        position: projection?.toWorld(screen) ?? screen,
                        // 🔴 [2026-09-12 主人报障「船尾水波不对」] 水迹贴图的行号必须与上面的**发射位移角同相位**：
                        //    位移角用 `(dir + 2) * π/8`，而贴图行号原先直接用 `dir` —— 同一函数里两套相位，
                        //    必然差 45°（2 档）：船斜着走、尾迹却朝另一个方向铺开。
                        //    按 DE 素材的相位差补偿 −2：`(shipDir − 2 + 16) % 16`。
                        //    ⚠️ 若实机观感反而更歪，把这里的 `+ 14` 换成 `+ 2` / `+ 4` 即可（只改这一个数）。
                        direction: (dir + 14) % 16, born: tick,
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
            ctx.drawImage(this.images[particle.kind]!, frame * asset.width, particle.direction * asset.height,
                asset.width, asset.height, point.x - w / 2, point.y - h / 2, w, h);
        }
        ctx.restore();
    }
}
