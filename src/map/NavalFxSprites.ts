import { NAVAL_FX, type NavalFxName } from './NavalFxMeta';
import { perfDoctor } from '../debug/PerfDoctor';

/**
 * 海战特效精灵播放器：直接播帝国时代2 决定版本体的特效帧（炮口焰、落水水花）。
 *
 * 🔴 为什么用 DE 的帧而不是自己用 canvas 画：
 *    2026-09-02 对着 DE 原素材逐帧比过 —— DE 的落水是「矮而宽的爆散水花 + 放射水丝，
 *    随后塌落摊平」，**没有**细高水柱、**没有**同心圆水纹；炮口是「橙红火光一闪 →
 *    立刻转成米白硝烟团 → 膨胀上飘变淡」，约 1 秒。手画的近似都不像。
 *
 * 图集由 `python scripts/naval_fx_atlas.py` 生成（裁剪 + 降采样 + 剔除坏帧），
 * 尺寸元数据在 NavalFxMeta.ts，改素材要重跑脚本，别手改。
 */

/**
 * DE 原始像素 → 屏幕像素的换算基准。
 * 与战船的绘制基准同源：LegionPhalanxDrawer.drawNaval 里 `s = baseHeight(72) * scale / 64`，
 * 再乘 NavalShipTiers 的基准船缩放 0.38。特效跟着这个走，才能和船身保持 DE 的原比例。
 */
const SRC_PX_PER_SCREEN_PX = (72 * 0.38) / 64;

export class NavalFxSprites {
    private static images = new Map<NavalFxName, HTMLImageElement>();
    private static failed = new Set<NavalFxName>();
    private static registered = false;

    /** 预取图集；重复调用无副作用。 */
    public static preload(): void {
        for (const name of Object.keys(NAVAL_FX) as NavalFxName[]) NavalFxSprites.get(name);
        NavalFxSprites.registerProbe();
    }

    private static registerProbe(): void {
        if (NavalFxSprites.registered || !import.meta.env.DEV) return;
        NavalFxSprites.registered = true;
        // PerfDoctor 铁律：任何图片缓存都要能报字节数。这里只有两张图集，报实际解码字节。
        perfDoctor.registerCache({
            name: 'NavalFxSprites:atlas(海战特效图集)',
            where: 'src/map/NavalFxSprites.ts',
            entries: () => NavalFxSprites.images.size,
            bytes: () => {
                let b = 0;
                for (const img of NavalFxSprites.images.values()) {
                    if (img.complete) b += img.naturalWidth * img.naturalHeight * 4;
                }
                return b;
            },
            limitKind: 'bytes',
            limitValue: 8 * 1024 * 1024,
        });
    }

    private static get(name: NavalFxName): HTMLImageElement | null {
        if (NavalFxSprites.failed.has(name)) return null;
        let img = NavalFxSprites.images.get(name);
        if (!img) {
            img = new Image();
            img.onerror = () => NavalFxSprites.failed.add(name);
            img.src = NAVAL_FX[name].url;
            NavalFxSprites.images.set(name, img);
            NavalFxSprites.registerProbe();
        }
        return img;
    }

    /** 特效总时长（ms），供调用方决定生命周期。 */
    public static durationMs(name: NavalFxName): number {
        return NAVAL_FX[name].durationMs;
    }

    /**
     * 画一帧。
     * @param t          0→1 的播放进度
     * @param drawScale  地图当前缩放系数（GlobalUnitRenderer 传下来的 `scale`）
     * @param rotation   弧度；炮口焰要按开火方位角转，水花传 0
     */
    public static draw(
        ctx: CanvasRenderingContext2D,
        name: NavalFxName,
        x: number,
        y: number,
        t: number,
        drawScale: number,
        rotation = 0,
    ): void {
        const img = NavalFxSprites.get(name);
        if (!img || !img.complete || img.naturalWidth === 0) return;

        const m = NAVAL_FX[name];
        const frame = Math.min(m.frames - 1, Math.max(0, Math.floor(t * m.frames)));
        // 图集像素 → 屏幕像素：先还原回 DE 原始像素（÷atlasScale），再按船身同一基准缩放
        const k = (SRC_PX_PER_SCREEN_PX * drawScale) / m.atlasScale;

        ctx.save();
        ctx.translate(x, y);
        if (rotation) ctx.rotate(rotation);
        ctx.scale(k, k);
        ctx.drawImage(
            img,
            frame * m.fw, 0, m.fw, m.fh,
            -m.anchorX, -m.anchorY, m.fw, m.fh,
        );
        ctx.restore();
    }
}

export type { NavalFxName };
export { NAVAL_FX };
