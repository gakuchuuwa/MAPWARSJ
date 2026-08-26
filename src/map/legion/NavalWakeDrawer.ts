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
        shipPositions: { x: number; y: number; r: number; isAlive: boolean }[],
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

        // 旋转角与前进/倒退单位矢量（正航向：headingX/Y）
        const angle = (d16 + 2) * Math.PI / 8;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const headingX = sin;
        const headingY = -cos;

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
            const trailSteps = [
                { dist: shipLength * 0.70, alpha: 0.35, scaleMul: 1.05, frameOffset: 0 },
                { dist: shipLength * 1.45, alpha: 0.20, scaleMul: 1.20, frameOffset: 10 },
                { dist: shipLength * 2.30, alpha: 0.08, scaleMul: 1.35, frameOffset: 20 },
            ];

            for (const step of trailSteps) {
                // 沿龙骨逆航向直线取点，保证尾流绝对顺直无歪斜漂移
                const tx = rearShip.x - headingX * step.dist;
                const ty = rearShip.y - headingY * step.dist;

                const frameIndex = (Math.floor(tick / 45) + step.frameOffset) % backAsset.meta.frames;
                const s = wakeScale * step.scaleMul;
                const w = backAsset.meta.box_w * s;
                const h = backAsset.meta.box_h * s;
                const left = tx - backAsset.meta.anchor_x * s;
                const top = ty - backAsset.meta.anchor_y * s;
                const sx = frameIndex * backAsset.meta.box_w;

                ctx.globalAlpha = step.alpha;
                ctx.drawImage(
                    backAsset.img,
                    sx, 0, backAsset.meta.box_w, backAsset.meta.box_h,
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

            // (1) 船首破浪（WAKE_FRONT）：旗舰浪大、僚舰浪适中
            const frontOffset = shipLength * 0.35;
            const fx = ship.x + headingX * frontOffset;
            const fy = ship.y + headingY * frontOffset;

            const sFront = wakeScale * (isFlagship ? 0.95 : 0.75);
            const wFront = frontAsset.meta.box_w * sFront;
            const hFront = frontAsset.meta.box_h * sFront;
            const leftFront = fx - frontAsset.meta.anchor_x * sFront;
            const topFront = fy - frontAsset.meta.anchor_y * sFront;
            const sxFront = (frameIndex % frontAsset.meta.frames) * frontAsset.meta.box_w;

            ctx.globalAlpha = isFlagship ? 0.55 : 0.40;
            ctx.drawImage(
                frontAsset.img,
                sxFront, 0, frontAsset.meta.box_w, frontAsset.meta.box_h,
                leftFront, topFront, wFront, hFront
            );

            // (2) 船尾翻波（WAKE_BACK）：贴在每艘船船尾后方自然推水
            const backOffset = shipLength * 0.38; // 稍微向后移，彻底避开船底阴影与船身切边
            const bx = ship.x - headingX * backOffset;
            const by = ship.y - headingY * backOffset;

            const sBack = wakeScale * (isFlagship ? 0.90 : 0.75);
            const wBack = backAsset.meta.box_w * sBack;
            const hBack = backAsset.meta.box_h * sBack;
            const leftBack = bx - backAsset.meta.anchor_x * sBack;
            const topBack = by - backAsset.meta.anchor_y * sBack;
            const sxBack = (frameIndex % backAsset.meta.frames) * backAsset.meta.box_w;

            ctx.globalAlpha = isFlagship ? 0.45 : 0.35;
            ctx.drawImage(
                backAsset.img,
                sxBack, 0, backAsset.meta.box_w, backAsset.meta.box_h,
                leftBack, topBack, wBack, hBack
            );
        }

        ctx.globalAlpha = 1.0;
    }
}
