/**
 * SpriteTinter.ts
 *
 * Canvas精灵染色处理器。
 * 使用Canvas 2D API对精灵图应用颜色染色。
 *
 * [2026-08-15 三套素材分流] 按素材来源走不同染色，各自复刻原游戏（主人定）：
 *   - 帝国决定 (AoE2 DE)：有 `.pc.png` 玩家色遮罩 → mask 染色
 *     （luminance-preserving hue shift + mask 强度混合，openage/martondobos 权威算法）
 *   - 三国志10 (S10DB) / 帝国征服 (AoE2 原版)：无遮罩 → 亮度染色（原 applyTint）
 */

import { TintColor, FactionTintSystem } from './FactionTintSystem';

/**
 * 有玩家色遮罩 `.pc.png` 的素材目录（AoE2 DE SLD 提取，全部 58 个）。
 * 这些目录走 mask 精确染色（玩家色 × 遮罩灰度）；其余（三国志10 S10DB / 帝国征服原版）走原有亮度染色，绝不改动它们的既有逻辑。
 * ⚠️ 新增 DE 兵种提取后必须同步加进这里，否则会误走亮度染色把金属/脸/马全染成势力色。
 */
const MASK_DIRS = ['/SUCAI/ARAMBAI/', '/SUCAI/ARBALEST/', '/SUCAI/ARCHER/', '/SUCAI/ARMORED_ELEPHANT/', '/SUCAI/BALLISTA_ELEPHANT/', '/SUCAI/BOYAR/', '/SUCAI/CAMEL_HEAVY/', '/SUCAI/CAV_ARCHER/', '/SUCAI/CHAMPION/', '/SUCAI/CHUKONU/', '/SUCAI/COMPOSITE_BOWMAN/', '/SUCAI/COUSTILLIER/', '/SUCAI/CROSSBOWMAN/', '/SUCAI/EASTERN_SWORDSMAN/', '/SUCAI/ELEPHANT_ARCHER/', '/SUCAI/ELITE_CHUKONU/', '/SUCAI/ELITE_COMPOSITE_BOWMAN/', '/SUCAI/ELITE_FIRE_ARCHER/', '/SUCAI/ELITE_FIRE_LANCER/', '/SUCAI/ELITE_GUARDSMAN/', '/SUCAI/ELITE_KIPCHAK/', '/SUCAI/ELITE_LIAO_DAO/', '/SUCAI/ELITE_STEPPE_LANCER/', '/SUCAI/ELITE_TARKAN/', '/SUCAI/ELITE_WHITE_FEATHER_GUARD/', '/SUCAI/FIRE_ARCHER/', '/SUCAI/FIRE_LANCER/', '/SUCAI/GRENADIER/', '/SUCAI/HEAVY_PIKEMAN/', '/SUCAI/HEI_KUANG/', '/SUCAI/HEI_KUANG_HEAVY/', '/SUCAI/IMPERIAL_SKIRMISHER/', '/SUCAI/IRON_PAGODA/', '/SUCAI/JIAN_SWORDSMAN/', '/SUCAI/KARAMBIT_WARRIOR/', '/SUCAI/KESHIK/', '/SUCAI/KIPCHAK/', '/SUCAI/LEGIONARY/', '/SUCAI/LIAO_DAO/', '/SUCAI/LIGHT_RIDERS/', '/SUCAI/LONGBOWMAN_ELITE/', '/SUCAI/MANGUDAI/', '/SUCAI/MANGUDAI_ELITE/', '/SUCAI/NINJA/', '/SUCAI/PALADIN/', '/SUCAI/PATTIYODA_LONGBOWMAN/', '/SUCAI/PIKEMAN/', '/SUCAI/RATTAN_ARCHER/', '/SUCAI/RATTAN_ARCHER_ELITE/', '/SUCAI/SAMURAI/', '/SUCAI/SAMURAI_DE/', '/SUCAI/SAMURAI_ELITE/', '/SUCAI/STEPPE_LANCER/', '/SUCAI/TARKAN/', '/SUCAI/THROWING_AXEMAN/', '/SUCAI/TIGER_RIDER/', '/SUCAI/WAR_ELEPHANT/', '/SUCAI/WHITE_FEATHER_GUARD/', '/SUCAI/XIANBEI_RAIDER/'];

/**
 * 精灵染色器
 */
export class SpriteTinter {
    // 缓存染色后的精灵图，避免每帧重复处理
    // Key: `${originalSrc}_${factionId}`；mask 染色的 key 前缀 `mask:` 区分
    private static tintedSpriteCache: Map<string, HTMLImageElement> = new Map();

    // 玩家色遮罩缓存：maskSrc -> Image（加载中/完成）或 'none'（确认无遮罩）
    private static maskCache: Map<string, HTMLImageElement | 'none'> = new Map();

    // 临时Canvas用于染色处理
    private static tempCanvas: HTMLCanvasElement | null = null;
    private static tempCtx: CanvasRenderingContext2D | null = null;
    private static maskCanvas: HTMLCanvasElement | null = null;
    private static maskCtx: CanvasRenderingContext2D | null = null;

    /**
     * 获取染色后的精灵图
     * @param originalSprite 原始精灵图
     * @param factionId 势力ID
     * @returns 染色后的精灵图（如果不需要染色则返回原图）
     */
    public static getTintedSprite(
        originalSprite: HTMLImageElement,
        factionId: string
    ): HTMLImageElement {
        // 检查是否需要染色
        if (!FactionTintSystem.shouldTint(factionId)) {
            return originalSprite;
        }

        const tintColor = FactionTintSystem.getTintColor(factionId);
        if (!tintColor) {
            return originalSprite;
        }

        const tintHex = FactionTintSystem.getTintHex(factionId);
        // [2026-08-15] 只对「帝国决定 DE」目录走 mask 染色；三国志10/帝国征服原版走原有亮度染色（不动它们的逻辑）
        const sourceUrl: string = (originalSprite as any).sourceUrl || originalSprite.src;
        if (MASK_DIRS.some(d => sourceUrl.includes(d))) {
            const maskSrc = sourceUrl.replace(/\.png$/, '.pc.png');
            return this.getMaskTinted(originalSprite, maskSrc, factionId, tintColor, tintHex);
        }
        return this.getLuminanceTinted(originalSprite, factionId, tintColor, tintHex);
    }

    /**
     * mask 染色入口（帝国决定 DE 素材，有玩家色遮罩）。
     * 遮罩惰性加载：首帧返回原图（玩家色区域暂灰），遮罩就绪后精确染色并缓存。
     */
    private static getMaskTinted(
        sprite: HTMLImageElement,
        maskSrc: string,
        factionId: string,
        tint: TintColor,
        tintHex: string | null
    ): HTMLImageElement {
        const cacheKey = `mask:${sprite.src}_${factionId}_${tintHex ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(cacheKey);
        if (cached && cached.complete) return cached;

        const maskState = this.maskCache.get(maskSrc);
        if (maskState === 'none') {
            // 确认无遮罩（onerror 过）→ 回亮度染色
            return this.getLuminanceTinted(sprite, factionId, tint, tintHex);
        }
        if (maskState && maskState.complete) {
            // 遮罩就绪 → mask 精确染色
            if (!sprite.complete || sprite.naturalWidth === 0) return sprite;
            const tinted = this.applyMaskTint(sprite, maskState, tint);
            this.tintedSpriteCache.set(cacheKey, tinted);
            return tinted;
        }
        // 首次：发起遮罩加载，本帧返回原图（不染全身，避免脸/皮肤被亮度染色误伤）
        if (!maskState) {
            const m = new Image();
            m.onload = () => this.maskCache.set(maskSrc, m);
            m.onerror = () => this.maskCache.set(maskSrc, 'none');
            m.src = maskSrc;
            this.maskCache.set(maskSrc, m);
        }
        return sprite;
    }

    /**
     * 亮度染色入口（三国志10 / 帝国征服原版素材，无遮罩）。
     */
    private static getLuminanceTinted(
        sprite: HTMLImageElement,
        factionId: string,
        tint: TintColor,
        tintHex: string | null
    ): HTMLImageElement {
        const cacheKey = `${sprite.src}_${factionId}_${tintHex ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(cacheKey);
        if (cached && cached.complete) return cached;

        // 如果原图未加载完成，返回原图
        if (!sprite.complete || sprite.naturalWidth === 0) return sprite;

        const tintedSprite = this.applyTint(sprite, tint);
        this.tintedSpriteCache.set(cacheKey, tintedSprite);
        return tintedSprite;
    }

    /**
     * mask 精确染色：玩家色遮罩非零像素 → 玩家色 × 遮罩灰度（乘法混合，AoE2 DE 原生）：
     *   遮罩白(255)=纯玩家色、遮罩灰=变暗（布料褶皱/图案明暗已烘焙在遮罩灰度里），
     *   非玩家色区域（脸/皮肤/金属/武器/马）保持 main 原色 —— 与 AoE2 DE 游戏内渲染一致。
     */
    private static applyMaskTint(
        sprite: HTMLImageElement,
        mask: HTMLImageElement,
        tint: TintColor
    ): HTMLImageElement {
        // 分别初始化主图/遮罩两个 canvas（applyTint 可能已初始化 tempCanvas 但未初始化 maskCanvas）
        if (!this.tempCanvas) {
            this.tempCanvas = document.createElement('canvas');
            this.tempCtx = this.tempCanvas.getContext('2d');
        }
        if (!this.maskCanvas) {
            this.maskCanvas = document.createElement('canvas');
            this.maskCtx = this.maskCanvas.getContext('2d');
        }

        const canvas = this.tempCanvas!;
        const ctx = this.tempCtx!;
        const mCanvas = this.maskCanvas!;
        const mCtx = this.maskCtx!;

        // 🔴 用 naturalWidth/Height（实际像素），不是 CSS width（可能被设 0 导致 getImageData 报「source width is 0」）
        const sw = sprite.naturalWidth || sprite.width;
        const sh = sprite.naturalHeight || sprite.height;
        const mw = mask.naturalWidth || mask.width;
        const mh = mask.naturalHeight || mask.height;
        if (!sw || !sh || !mw || !mh) return sprite;

        canvas.width = sw;
        canvas.height = sh;
        mCanvas.width = mw;
        mCanvas.height = mh;

        // 主图像素
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sprite, 0, 0);
        const mainImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const main = mainImageData.data;

        // 遮罩像素（alpha = 玩家色强度 0-255）
        mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
        mCtx.drawImage(mask, 0, 0);
        const maskImageData = mCtx.getImageData(0, 0, mCanvas.width, mCanvas.height);
        const maskData = maskImageData.data;

        const n = Math.min(main.length, maskData.length);
        for (let i = 0; i < n; i += 4) {
            const strength = maskData[i + 3];
            if (strength === 0) continue; // 非玩家色区域，保持 main 原样

            // AoE2 DE 原生玩家色 = 玩家色 × 遮罩灰度（乘法混合）：
            //   遮罩白(255)=纯玩家色、遮罩灰=玩家色变暗（布料明暗烘焙在遮罩里），
            //   不用 main 占位色（黑/灰）的亮度——那亮度不含布料明暗，hue shift 会染成一片死色。
            main[i] = Math.round(tint.r * strength / 255);
            main[i + 1] = Math.round(tint.g * strength / 255);
            main[i + 2] = Math.round(tint.b * strength / 255);
            // Alpha 保持 main 的 alpha（不透明/抗锯齿边缘）
        }

        ctx.putImageData(mainImageData, 0, 0);

        const tintedImage = new Image();
        tintedImage.src = canvas.toDataURL('image/png');
        return tintedImage;
    }

    /**
     * 应用染色到精灵图（亮度染色，S10DB / 帝国征服原版素材）
     */
    private static applyTint(
        sprite: HTMLImageElement,
        tint: TintColor
    ): HTMLImageElement {
        // 初始化临时Canvas
        if (!this.tempCanvas) {
            this.tempCanvas = document.createElement('canvas');
            this.tempCtx = this.tempCanvas.getContext('2d');
        }

        const canvas = this.tempCanvas!;
        const ctx = this.tempCtx!;

        canvas.width = sprite.width;
        canvas.height = sprite.height;

        // 1. 绘制原始图像
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(sprite, 0, 0);

        // 2. 获取图像数据并应用染色
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3];
            if (alpha === 0) continue; // 跳过透明像素

            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 计算染色颜色的亮度
            const tintBrightness = 0.299 * tint.r + 0.587 * tint.g + 0.114 * tint.b;
            // [优化] 阈值从 150 降至 20
            // 除了纯黑(秦)之外，所有彩色(蓝/红/绿等)都应视为"亮色"，
            // 从而走下方"阴影保护"逻辑，避免把黑色阴影染成彩色而丢失轮廓。
            const isLightTint = tintBrightness > 20;

            // [选择性染色]
            // 计算像素亮度 (0-255)
            const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

            // 1. 保护高光区域（武器/金属光泽）
            // 保持原样，否则金属会看起来很假
            const highlightThreshold = 180;
            if (brightness > highlightThreshold) {
                continue;
            }

            // 2. 保护深色轮廓线 (Outline Preservation)
            // 如果是深色像素，且我们正在染浅色(如白色)，则必须保护轮廓
            // 否则黑色轮廓变成白色，单位就"隐身"了
            const outlineThreshold = 60;
            if (isLightTint && brightness < outlineThreshold) {
                // 如果是轮廓线，且染浅色，几乎不染色，保持原黑
                continue;
            }

            // 3. 计算自适应强度
            let adjustedIntensity = tint.intensity;

            if (isLightTint) {
                // [优化] 针对浅色(白/黄/粉)的阴影保护算法
                // 问题：染白色会把深灰色的阴影提亮变成浅灰，导致立体感丢失
                // 解决：根据像素亮度决定染色强度。越暗的像素，染色强度越低（保留原始黑色）

                // 归一化亮度 (0-1)
                const nBrightness = brightness / 255;

                // 使用幂函数曲线 (Power 1.5) 让暗部衰减得更快
                // 例如：亮度0.2(阴影) -> 强度系数 0.08 (几乎不染)
                //      亮度0.8(高光) -> 强度系数 0.71 (正常染)
                adjustedIntensity = tint.intensity * Math.pow(nBrightness, 1.5);

            } else {
                // 染深色时(如秦军黑)：
                // 越暗的地方染越少(本来就黑)
                // 越亮的地方染越多(把它变黑)
                // 原逻辑保持不变
                adjustedIntensity = tint.intensity * (1 - brightness / highlightThreshold * 0.7);
            }

            // 混合原始颜色和染色颜色
            // [Fix] 使用 brightness (灰度) 代替 r/g/b 进行混合
            // 这样可以去除原始素材的底色（蓝色），确保染色纯正
            // 例如：蓝底 + 红染 = 紫色 (旧) -> 灰底 + 红染 = 红色 (新)
            data[i] = Math.round(brightness * (1 - adjustedIntensity) + tint.r * adjustedIntensity);     // R
            data[i + 1] = Math.round(brightness * (1 - adjustedIntensity) + tint.g * adjustedIntensity); // G
            data[i + 2] = Math.round(brightness * (1 - adjustedIntensity) + tint.b * adjustedIntensity); // B
            // Alpha 保持不变
        }

        ctx.putImageData(imageData, 0, 0);

        // 3. 创建新的Image对象
        const tintedImage = new Image();
        tintedImage.src = canvas.toDataURL('image/png');

        return tintedImage;
    }

    /**
     * 清除缓存（当势力颜色改变时调用）
     */
    public static clearCache(): void {
        this.tintedSpriteCache.clear();
        this.maskCache.clear();
        console.log('🎨 [SpriteTinter] Cache cleared');
    }

    /**
     * 预处理特定势力的精灵图
     * 在游戏开始时调用以避免运行时延迟
     */
    public static async preloadTintedSprites(
        sprites: HTMLImageElement[],
        factionIds: string[]
    ): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const sprite of sprites) {
            for (const factionId of factionIds) {
                promises.push(new Promise<void>((resolve) => {
                    const tinted = this.getTintedSprite(sprite, factionId);
                    if (tinted.complete) {
                        resolve();
                    } else {
                        tinted.onload = () => resolve();
                        tinted.onerror = () => resolve();
                    }
                }));
            }
        }

        await Promise.all(promises);
        console.log('🎨 [SpriteTinter] Preloaded tinted sprites for', factionIds.length, 'factions');
    }
}
