/**
 * 战略地图船只水上拖尾与水花绘制器（NavalWakeDrawer）
 *
 * 依据 AoE2 DE 原生粒子系统：
 * - resources\_common\particles\wake_back_*.json (船尾尾波/尾迹)
 * - resources\_common\particles\wake_front_*.json (船头破浪水花)
 * - 16 方向（0~15），每个方向 30 帧连续水纹动画
 * - 渲染在水面层（船体底层），随船体航行产生即时浪花与沿历史航迹消散的白色波纹拖尾。
 */

interface WakeDirMeta {
    frames: number;
    box_w: number;
    box_h: number;
    anchor_x: number;
    anchor_y: number;
    dir: number;
}

interface WakeDirAsset {
    img: HTMLImageElement | null;
    meta: WakeDirMeta;
    loaded: boolean;
}

export class NavalWakeDrawer {
    private static wakeBackDirs: (WakeDirAsset | null)[] = new Array(16).fill(null);
    private static wakeFrontDirs: (WakeDirAsset | null)[] = new Array(16).fill(null);
    private static isLoading = false;
    private static isLoaded = false;

    /** 预加载 16 方向 WAKE_BACK 与 WAKE_FRONT 素材 */
    public static ensureLoaded(): void {
        if (this.isLoaded || this.isLoading) return;
        this.isLoading = true;

        const loadDir = (type: 'WAKE_BACK' | 'WAKE_FRONT', dirIdx: number): Promise<WakeDirAsset | null> => {
            const dirStr = `dir${String(dirIdx).padStart(2, '0')}`;
            const basePath = `/SUCAI/${type}/${dirStr}/`;
            const defaultBox = type === 'WAKE_BACK' ? 140 : 120;
            const defaultAnchor = defaultBox / 2;

            return fetch(`${basePath}_meta.json`)
                .then(res => res.ok ? res.json() : null)
                .catch(() => null)
                .then(metaJson => {
                    const meta: WakeDirMeta = metaJson || {
                        frames: 30,
                        box_w: defaultBox,
                        box_h: defaultBox,
                        anchor_x: defaultAnchor,
                        anchor_y: defaultAnchor,
                        dir: dirIdx,
                    };
                    return new Promise<WakeDirAsset>((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve({ img, meta, loaded: true });
                        img.onerror = () => resolve({ img: null, meta, loaded: false });
                        img.src = `${basePath}fly_0.png`;
                    });
                })
                .catch(() => null);
        };

        const promises: Promise<any>[] = [];
        for (let d = 0; d < 16; d++) {
            promises.push(
                loadDir('WAKE_BACK', d).then(asset => {
                    this.wakeBackDirs[d] = asset;
                }),
                loadDir('WAKE_FRONT', d).then(asset => {
                    this.wakeFrontDirs[d] = asset;
                })
            );
        }

        Promise.all(promises).then(() => {
            this.isLoaded = true;
            this.isLoading = false;
        });
    }

    /**
     * 绘制舰队水上拖尾（在船体之前调用，位于水面层）
     */
    public static drawNavalWakes(
        ctx: CanvasRenderingContext2D,
        shipPositions: { x: number; y: number; r: number; isAlive: boolean }[],
        direction: number,
        scale: number,
        tick: number,
        isMoving: boolean,
        trail?: { x: number; y: number }[],
        shipLength: number = 60,
    ): void {
        this.ensureLoaded();
        if (!isMoving) return; // 静止待命状态不激起大浪花与拖尾

        const d16 = ((direction % 16) + 16) % 16;
        const backAsset = this.wakeBackDirs[d16];
        const frontAsset = this.wakeFrontDirs[d16];

        // 统一水花尺寸缩放（匹配船只缩放）
        const wakeScale = scale * 0.85;

        // 旋转角与前进/倒退单位矢量
        const angle = (d16 + 2) * Math.PI / 8;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const headingX = sin;
        const headingY = -cos;

        // 找到队首旗舰（r 最大/最前）与队尾船（r 最小/最后）
        let frontShip: { x: number; y: number; r: number; isAlive: boolean } | null = null;
        let rearShip: { x: number; y: number; r: number; isAlive: boolean } | null = null;
        for (const s of shipPositions) {
            if (!s.isAlive) continue;
            if (!frontShip || s.r > frontShip.r) frontShip = s;
            if (!rearShip || s.r < rearShip.r) rearShip = s;
        }

        // ─── 1. 沿历史航迹绘制消散长拖尾（Trailing Wake Trail）────────────────
        if (trail && trail.length >= 2 && backAsset && backAsset.loaded && backAsset.img && rearShip) {
            const tailDist = Math.abs(rearShip.r) * shipLength;

            // 拖尾段数（沿航迹往后拉出 3 段自然渐隐消散水纹）
            const trailSteps = [
                { dist: tailDist + shipLength * 0.6, alpha: 0.32, scaleMul: 1.05, frameOffset: 0 },
                { dist: tailDist + shipLength * 1.3, alpha: 0.18, scaleMul: 1.18, frameOffset: 10 },
                { dist: tailDist + shipLength * 2.2, alpha: 0.08, scaleMul: 1.30, frameOffset: 20 },
            ];

            for (const step of trailSteps) {
                const pt = this.getTrailPoint(trail, step.dist);
                if (!pt) continue;

                const frameIndex = (Math.floor(tick / 45) + step.frameOffset) % backAsset.meta.frames;
                const s = wakeScale * step.scaleMul;
                const w = backAsset.meta.box_w * s;
                const h = backAsset.meta.box_h * s;
                const left = pt.x - backAsset.meta.anchor_x * s;
                const top = pt.y - backAsset.meta.anchor_y * s;
                const sx = frameIndex * backAsset.meta.box_w;

                ctx.globalAlpha = step.alpha;
                ctx.drawImage(
                    backAsset.img,
                    sx, 0, backAsset.meta.box_w, backAsset.meta.box_h,
                    left, top, w, h
                );
            }
            ctx.globalAlpha = 1.0;
        }

        // ─── 2. 船队即时浪花：旗舰船首破浪（Bow Wave）+ 队尾翻波（Stern Wake）─────
        const frameIndex = Math.floor(tick / 40) % 30;

        // 2.1 旗舰船首破浪（WAKE_FRONT）：领头前锋劈波斩浪
        if (frontShip && frontAsset && frontAsset.loaded && frontAsset.img) {
            const frontOffset = shipLength * 0.35;
            const fx = frontShip.x + headingX * frontOffset;
            const fy = frontShip.y + headingY * frontOffset;

            const s = wakeScale * 0.95;
            const w = frontAsset.meta.box_w * s;
            const h = frontAsset.meta.box_h * s;
            const left = fx - frontAsset.meta.anchor_x * s;
            const top = fy - frontAsset.meta.anchor_y * s;
            const sx = (frameIndex % frontAsset.meta.frames) * frontAsset.meta.box_w;

            ctx.globalAlpha = 0.50;
            ctx.drawImage(
                frontAsset.img,
                sx, 0, frontAsset.meta.box_w, frontAsset.meta.box_h,
                left, top, w, h
            );
        }

        // 2.2 队尾船只翻波（WAKE_BACK）：贴在舰队末尾后方推水
        if (rearShip && backAsset && backAsset.loaded && backAsset.img) {
            const backOffset = shipLength * 0.30;
            const bx = rearShip.x - headingX * backOffset;
            const by = rearShip.y - headingY * backOffset;

            const s = wakeScale;
            const w = backAsset.meta.box_w * s;
            const h = backAsset.meta.box_h * s;
            const left = bx - backAsset.meta.anchor_x * s;
            const top = by - backAsset.meta.anchor_y * s;
            const sx = (frameIndex % backAsset.meta.frames) * backAsset.meta.box_w;

            ctx.globalAlpha = 0.40;
            ctx.drawImage(
                backAsset.img,
                sx, 0, backAsset.meta.box_w, backAsset.meta.box_h,
                left, top, w, h
            );
        }

        ctx.globalAlpha = 1.0;
    }

    /** 沿航迹按弧长取点 */
    private static getTrailPoint(trail: { x: number; y: number }[], distAlong: number): { x: number; y: number } | null {
        if (!trail || trail.length < 2) return null;
        let acc = 0;
        for (let j = trail.length - 1; j > 0; j--) {
            const a = trail[j];
            const b = trail[j - 1];
            if (!a || !b) continue;
            const seg = Math.hypot(a.x - b.x, a.y - b.y);
            if (acc + seg >= distAlong) {
                const t = (distAlong - acc) / (seg || 1);
                return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
            }
            acc += seg;
        }
        const oldest = trail[0];
        const next = trail[1] ?? oldest;
        if (!oldest || !next) return null;
        const ex = oldest.x - next.x;
        const ey = oldest.y - next.y;
        const elen = Math.hypot(ex, ey);
        if (elen < 0.001) return oldest;
        const rest = distAlong - acc;
        return { x: oldest.x + (ex / elen) * rest, y: oldest.y + (ey / elen) * rest };
    }
}
