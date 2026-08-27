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
     * 1. 舰队每艘存活船只各自独立激起船首破浪（WAKE_FRONT）与船尾翻波（WAKE_BACK）
     * 2. 队尾船只沿龙骨逆航向正后方拉出 3 段平滑消散的白色直线尾浪带
     */
    public static drawNavalWakes(
        ctx: CanvasRenderingContext2D,
        shipPositions: { x: number; y: number; r: number; isAlive: boolean; dir?: number }[],
        direction: number,
        scale: number,
        tick: number,
        isMoving: boolean,
        _trail?: { x: number; y: number }[],
        shipLength: number = 60,
    ): void {
        this.ensureLoaded();
        if (!isMoving) return; // 静止待命状态不激起大浪花与拖尾

        const d16 = ((direction % 16) + 16) % 16;
        const backAsset = this.wakeBackDirs[d16];
        const frontAsset = this.wakeFrontDirs[d16];

        if (!backAsset?.loaded || !backAsset.img || !frontAsset?.loaded || !frontAsset.img) return;

        // 统一水花尺寸缩放
        const wakeScale = scale * 0.85;

        // 🔴 [2026-08-27 航迹跟随] 后随船现在沿旗舰航迹排开（见 drawNaval），转弯时每艘船朝向都不同。
        //   尾迹若仍共用旗舰航向，队尾的破浪/翻波会横着糊出去（船头朝东、浪花朝北）。
        //   这里改为逐船取自己的 dir：素材按该向取（缺则回落旗舰向），航向矢量各算各的。
        const backFallback = { img: backAsset.img, meta: backAsset.meta };
        const frontFallback = { img: frontAsset.img, meta: frontAsset.meta };
        const dirOf = (sh: { dir?: number; x: number; y: number }): number =>
            sh.dir === undefined ? d16 : ((Math.round(sh.dir) % 16) + 16) % 16;
        const backOf = (d: number): { img: HTMLImageElement; meta: WakeDirMeta } => {
            const a = this.wakeBackDirs[d];
            return a?.loaded && a.img ? { img: a.img, meta: a.meta } : backFallback;
        };
        const frontOf = (d: number): { img: HTMLImageElement; meta: WakeDirMeta } => {
            const a = this.wakeFrontDirs[d];
            return a?.loaded && a.img ? { img: a.img, meta: a.meta } : frontFallback;
        };
        /** 16 向 → 屏幕前进单位矢量（与 drawNaval 的 angle=(d+2)π/8 同源） */
        const headingOf = (d: number): { hx: number; hy: number } => {
            const a = (d + 2) * Math.PI / 8;
            return { hx: Math.sin(a), hy: -Math.cos(a) };
        };

        // 找到队首旗舰（r 最大）与队尾船（r 最小）
        let frontShip: { x: number; y: number; r: number; isAlive: boolean } | null = null;
        let rearShip: { x: number; y: number; r: number; isAlive: boolean } | null = null;
        for (const s of shipPositions) {
            if (!s.isAlive) continue;
            if (!frontShip || s.r > frontShip.r) frontShip = s;
            if (!rearShip || s.r < rearShip.r) rearShip = s;
        }

        // ─── 1. 队尾船只沿船体龙骨正后方拉出 3 段消散尾流（Keel-Aligned Wake Trail）───
        if (rearShip) {
            const rDir = dirOf(rearShip);
            const rAsset = backOf(rDir);
            const rHead = headingOf(rDir);
            const trailSteps = [
                { dist: shipLength * 0.70, alpha: 0.35, scaleMul: 1.05, frameOffset: 0 },
                { dist: shipLength * 1.45, alpha: 0.20, scaleMul: 1.20, frameOffset: 10 },
                { dist: shipLength * 2.30, alpha: 0.08, scaleMul: 1.35, frameOffset: 20 },
            ];

            for (const step of trailSteps) {
                // 沿龙骨逆航向直线取点，保证尾流绝对顺直无歪斜漂移
                const tx = rearShip.x - rHead.hx * step.dist;
                const ty = rearShip.y - rHead.hy * step.dist;

                const frameIndex = (Math.floor(tick / 45) + step.frameOffset) % rAsset.meta.frames;
                const s = wakeScale * step.scaleMul;
                const w = rAsset.meta.box_w * s;
                const h = rAsset.meta.box_h * s;
                const left = tx - rAsset.meta.anchor_x * s;
                const top = ty - rAsset.meta.anchor_y * s;
                const sx = frameIndex * rAsset.meta.box_w;

                ctx.globalAlpha = step.alpha;
                ctx.drawImage(
                    rAsset.img,
                    sx, 0, rAsset.meta.box_w, rAsset.meta.box_h,
                    left, top, w, h
                );
            }
        }

        // ─── 2. 舰队全员逐舰即时浪花（每艘船均有船头破浪 + 船尾翻波）────────────
        for (let i = 0; i < shipPositions.length; i++) {
            const ship = shipPositions[i];
            if (!ship || !ship.isAlive) continue;

            const isFlagship = (ship === frontShip);
            const animOffset = i * 75; // 各舰水花产生微小相位差，更加生动自然
            const frameIndex = Math.floor((tick + animOffset) / 40) % 30;

            const sDir = dirOf(ship);
            const sHead = headingOf(sDir);
            const fAsset = frontOf(sDir);
            const bAsset = backOf(sDir);

            // (1) 船首破浪（WAKE_FRONT）：旗舰浪大、僚舰浪适中
            const frontOffset = shipLength * 0.35;
            const fx = ship.x + sHead.hx * frontOffset;
            const fy = ship.y + sHead.hy * frontOffset;

            const sFront = wakeScale * (isFlagship ? 0.95 : 0.75);
            const wFront = fAsset.meta.box_w * sFront;
            const hFront = fAsset.meta.box_h * sFront;
            const leftFront = fx - fAsset.meta.anchor_x * sFront;
            const topFront = fy - fAsset.meta.anchor_y * sFront;
            const sxFront = (frameIndex % fAsset.meta.frames) * fAsset.meta.box_w;

            ctx.globalAlpha = isFlagship ? 0.55 : 0.40;
            ctx.drawImage(
                fAsset.img,
                sxFront, 0, fAsset.meta.box_w, fAsset.meta.box_h,
                leftFront, topFront, wFront, hFront
            );

            // (2) 船尾翻波（WAKE_BACK）：贴在每艘船船尾后方自然推水
            const backOffset = shipLength * 0.38; // 稍微向后移，彻底避开船底阴影与船身切边
            const bx = ship.x - sHead.hx * backOffset;
            const by = ship.y - sHead.hy * backOffset;

            const sBack = wakeScale * (isFlagship ? 0.90 : 0.75);
            const wBack = bAsset.meta.box_w * sBack;
            const hBack = bAsset.meta.box_h * sBack;
            const leftBack = bx - bAsset.meta.anchor_x * sBack;
            const topBack = by - bAsset.meta.anchor_y * sBack;
            const sxBack = (frameIndex % bAsset.meta.frames) * bAsset.meta.box_w;

            ctx.globalAlpha = isFlagship ? 0.45 : 0.35;
            ctx.drawImage(
                bAsset.img,
                sxBack, 0, bAsset.meta.box_w, bAsset.meta.box_h,
                leftBack, topBack, wBack, hBack
            );
        }

        ctx.globalAlpha = 1.0;
    }
}
