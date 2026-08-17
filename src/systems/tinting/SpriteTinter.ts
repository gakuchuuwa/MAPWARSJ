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
 * 有玩家色遮罩 `.pc.png` 的素材目录（AoE2 DE SLD 提取）。
 * [2026-08-17 校准] 原注释写「全部 58 个」，实际本数组已有 231 条；素材侧共 286 个目录带遮罩
 * （多出的是未被引擎引用的重复/投射物目录）。已核对：引擎渲染表 DE_DYN_DIRS 的 230 个目录
 * 100% 在本白名单内，无漏登记。
 * 这些目录走 mask 精确染色（玩家色 × 遮罩灰度）；其余（三国志10 S10DB / 帝国征服原版）走原有亮度染色，绝不改动它们的既有逻辑。
 * ⚠️ 新增 DE 兵种提取后必须同步加进这里，否则会误走亮度染色把金属/脸/马全染成势力色。
 */
const MASK_DIRS = ['/SUCAI/ARAMBAI/', '/SUCAI/ARBALEST/', '/SUCAI/ARCHER/', '/SUCAI/ARMORED_ELEPHANT/', '/SUCAI/BALLISTA_ELEPHANT/', '/SUCAI/BOYAR/', '/SUCAI/SAVAR/', '/SUCAI/CAMEL_HEAVY/', '/SUCAI/CAV_ARCHER/', '/SUCAI/CAV_ARCHER_HEAVY/', '/SUCAI/CHAMPION/', '/SUCAI/CHUKONU/', '/SUCAI/COMPOSITE_BOWMAN/', '/SUCAI/COUSTILLIER/', '/SUCAI/CROSSBOWMAN/', '/SUCAI/EASTERN_SWORDSMAN/', '/SUCAI/ELEPHANT_ARCHER/', '/SUCAI/ELITE_CHUKONU/', '/SUCAI/ELITE_COMPOSITE_BOWMAN/', '/SUCAI/ELITE_FIRE_ARCHER/', '/SUCAI/ELITE_FIRE_LANCER/', '/SUCAI/ELITE_GUARDSMAN/', '/SUCAI/ELITE_KIPCHAK/', '/SUCAI/ELITE_LIAO_DAO/', '/SUCAI/ELITE_STEPPE_LANCER/', '/SUCAI/ELITE_TARKAN/', '/SUCAI/ELITE_WHITE_FEATHER_GUARD/', '/SUCAI/FIRE_ARCHER/', '/SUCAI/FIRE_LANCER/', '/SUCAI/GRENADIER/', '/SUCAI/HEAVY_PIKEMAN/', '/SUCAI/HEI_KUANG/', '/SUCAI/HEI_KUANG_HEAVY/', '/SUCAI/IMPERIAL_SKIRMISHER/', '/SUCAI/IRON_PAGODA/', '/SUCAI/JIAN_SWORDSMAN/', '/SUCAI/KAMAYUK/', '/SUCAI/KARAMBIT_WARRIOR/', '/SUCAI/KARAMBIT_WARRIOR_ELITE/', '/SUCAI/KESHIK/', '/SUCAI/KIPCHAK/', '/SUCAI/LEGIONARY/', '/SUCAI/LIAO_DAO/', '/SUCAI/LIGHT_RIDERS/', '/SUCAI/LONGBOWMAN_ELITE/', '/SUCAI/MANGUDAI/', '/SUCAI/MANGUDAI_ELITE/', '/SUCAI/NINJA/', '/SUCAI/PALADIN/', '/SUCAI/PATTIYODA_LONGBOWMAN/', '/SUCAI/PIKEMAN/', '/SUCAI/RATTAN_ARCHER/', '/SUCAI/RATTAN_ARCHER_ELITE/', '/SUCAI/SAMURAI/', '/SUCAI/SAMURAI_DE/', '/SUCAI/SAMURAI_ELITE/', '/SUCAI/SWORDSMAN/', '/SUCAI/STEPPE_LANCER/', '/SUCAI/TARKAN/', '/SUCAI/THROWING_AXEMAN/', '/SUCAI/TIGER_RIDER/', '/SUCAI/WAR_ELEPHANT/', '/SUCAI/WHITE_FEATHER_GUARD/', '/SUCAI/XIANBEI_RAIDER/', '/SUCAI/AMAZONARCHER/', '/SUCAI/AMAZONWARRIOR/', '/SUCAI/BACTRIAN_ARCHER/', '/SUCAI/BATTERINGRAM/', '/SUCAI/BERSERK/', '/SUCAI/BLACKWOODARCHER/', '/SUCAI/BOLASRIDER/', '/SUCAI/BOMBARDCANNON/', '/SUCAI/CAMELARCHER/', '/SUCAI/CAMEL_RAIDER/', '/SUCAI/CAMELRIDER/', '/SUCAI/CAMELSCOUT/', '/SUCAI/CAPPEDRAM/', '/SUCAI/CATAPHRACT/', '/SUCAI/CENTURION/', '/SUCAI/CHAKRAMTHROWER/', '/SUCAI/CHAMPIRUNNER/', '/SUCAI/CHAMPISCOUT/', '/SUCAI/COMPANION_CAVALRY/', '/SUCAI/CONDOTTIERO/', '/SUCAI/CONQUISTADOR/', '/SUCAI/CRETAN_ARCHER/', '/SUCAI/EAGLESCOUT/', '/SUCAI/EAGLEWARRIOR/', '/SUCAI/EKDROMOS/', '/SUCAI/ELITEARAMBAI/', '/SUCAI/ELITEBALLISTAELEPHANT/', '/SUCAI/ELITEBATTLEELEPHANT/', '/SUCAI/ELITEBERSERK/', '/SUCAI/ELITEBLACKWOODARCHER/', '/SUCAI/ELITEBOLASRIDER/', '/SUCAI/ELITEBOYAR/', '/SUCAI/ELITECAMELARCHER/', '/SUCAI/ELITECATAPHRACT/', '/SUCAI/ELITECENTURION/', '/SUCAI/ELITECHAKRAMTHROWER/', '/SUCAI/ELITECHAMPIWARRIOR/', '/SUCAI/ELITECONQUISTADOR/', '/SUCAI/ELITECOUSTILLIER/', '/SUCAI/ELITEEAGLEWARRIOR/', '/SUCAI/ELITEELEPHANTARCHER/', '/SUCAI/ELITEGBETO/', '/SUCAI/ELITEGENITOUR/', '/SUCAI/ELITEGENOESECROSSBOWMAN/', '/SUCAI/ELITEGHULAM/', '/SUCAI/ELITEGUECHAWARRIOR/', '/SUCAI/ELITEHUSKARL/', '/SUCAI/ELITEHUSSITEWAGON/', '/SUCAI/ELITEIBIRAPEMAWARRIOR/', '/SUCAI/ELITEIRONPAGODA/', '/SUCAI/ELITEJAGUARWARRIOR/', '/SUCAI/ELITEJANISSARY/', '/SUCAI/ELITEKAMAYUK/', '/SUCAI/ELITEKESHIK/', '/SUCAI/ELITEKONA/', '/SUCAI/ELITEKONNIK/', '/SUCAI/ELITEFOOTKONNIK/', '/SUCAI/ELITELEITIS/', '/SUCAI/ELITEMAMELUKE/', '/SUCAI/ELITEMONASPA/', '/SUCAI/ELITEOBUCH/', '/SUCAI/ELITEORGANGUN/', '/SUCAI/ELITEPLUMEDARCHER/', '/SUCAI/ELITERATHAMELEE/', '/SUCAI/ELITERATHARANGED/', '/SUCAI/ELITE_SCYTHIAN_HORSE_ARCHER/', '/SUCAI/ELITESERJEANT/', '/SUCAI/ELITESHOTELWARRIOR/', '/SUCAI/ELITESHRIVAMSHARIDER/', '/SUCAI/ELITESKIRMISHER/', '/SUCAI/ELITETEMPLEGUARD/', '/SUCAI/ELITETEUTONICKNIGHT/', '/SUCAI/ELITETHROWINGAXEMAN/', '/SUCAI/ELITETIGERCAVALRY/', '/SUCAI/ELITEURUMISWORDSMAN/', '/SUCAI/ELITE_WAR_CHARIOT/', '/SUCAI/ELITEWARDOG/', '/SUCAI/ELITEWARELEPHANT/', '/SUCAI/ELITEWARWAGON/', '/SUCAI/ELITEWOADRAIDER/', '/SUCAI/FLAMINGCAMEL/', '/SUCAI/FLEMISHPIKEMAN/', '/SUCAI/FLEMISHPIKEMAN_F/', '/SUCAI/GBETO/', '/SUCAI/GENITOUR/', '/SUCAI/GENOESECROSSBOWMAN/', '/SUCAI/GHULAM/', '/SUCAI/GREEK_NOBLE_CAVALRY/', '/SUCAI/GRENADIER/', '/SUCAI/GUECHAWARRIOR/', '/SUCAI/HANDCANNONEER/', '/SUCAI/HEAVYROCKETCART/', '/SUCAI/HEAVYSCORPION/', '/SUCAI/HILL_TRIBESMAN/', '/SUCAI/HIPPEUS/', '/SUCAI/HOPLITE/', '/SUCAI/HOUFNICE/', '/SUCAI/HUSKARL/', '/SUCAI/HUSSAR/', '/SUCAI/HUSSITEWAGON/', '/SUCAI/IBIRAPEMAWARRIOR/', '/SUCAI/IMMORTAL/', '/SUCAI/RANGED_IMMORTAL/', '/SUCAI/IMPERIALCAMELRIDER/', '/SUCAI/IMPERIALCENTURION/', '/SUCAI/INDIAN_TRIBESMAN/', '/SUCAI/IROQUOISWARRIOR/', '/SUCAI/JAGUARWARRIOR/', '/SUCAI/JANISSARY/', '/SUCAI/KNIGHT/', '/SUCAI/KONA/', '/SUCAI/KONNIK/', '/SUCAI/FOOTKONNIK/', '/SUCAI/LEITIS/', '/SUCAI/LONGBOWMAN/', '/SUCAI/MAGYARHUSZAR/', '/SUCAI/MAMELUKE/', '/SUCAI/MANGONEL/', '/SUCAI/ELITE_HOPLITE/', '/SUCAI/MILITIA/', '/SUCAI/MONASPA/', '/SUCAI/MOUNTEDTREBUCHET/', '/SUCAI/OBUCH/', '/SUCAI/ONAGER/', '/SUCAI/ORGANGUN/', '/SUCAI/PETARD/', '/SUCAI/PHALANGITE/', '/SUCAI/PLUMEDARCHER/', '/SUCAI/QIZILBASHWARRIOR/', '/SUCAI/RATHAMELEE/', '/SUCAI/RATHARANGED/', '/SUCAI/RHODIAN_SLINGER/', '/SUCAI/RHOMPHAIA_WARRIOR/', '/SUCAI/ROCKETCART/', '/SUCAI/ROYALJANISSARY/', '/SUCAI/SACRED_BAND/', '/SUCAI/SANNAHYA/', '/SUCAI/SCORPION/', '/SUCAI/SCYTHIAN_AXE_CAVALRY/', '/SUCAI/SCYTHIAN_HORSE_ARCHER/', '/SUCAI/SERJEANT/', '/SUCAI/SHOTELWARRIOR/', '/SUCAI/SHRIVAMSHARIDER/', '/SUCAI/SICKLE_WARRIOR/', '/SUCAI/SIEGEONAGER/', '/SUCAI/SIEGERAM/', '/SUCAI/SKIRMISHER/', '/SUCAI/SLINGER/', '/SUCAI/SOGDIANCATAPHRACT/', '/SUCAI/SPARABARA/', '/SUCAI/SPEARMAN/', '/SUCAI/STRATEGOS/', '/SUCAI/SAKAN_AXEMAN/', '/SUCAI/TARANTINE_CAVALRY/', '/SUCAI/TEMPLEGUARD/', '/SUCAI/TEUTONICKNIGHT/', '/SUCAI/THRACIAN_PELTAST/', '/SUCAI/TRACTIONTREBUCHET/', '/SUCAI/TWOHANDEDSWORDSMAN/', '/SUCAI/URUMISWORDSMAN/', '/SUCAI/WAR_CHARIOT/', '/SUCAI/WARCHARIOT/', '/SUCAI/WARDOG/', '/SUCAI/WARWAGON/', '/SUCAI/WARRIORPRIEST/', '/SUCAI/WINGEDHUSSAR/', '/SUCAI/WOADRAIDER/', '/SUCAI/XOLOTLWARRIOR/'];

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
        // 🔴 [2026-08-17 修 13 开场卡 12.8 秒] 必须带 willReadFrequently。
        //    这两张 canvas 的用途就是 getImageData 逐像素读，不带这个标志时浏览器会把 canvas
        //    放在 GPU 上，每次 getImageData 都要 GPU→CPU 回读，单次几十毫秒。
        //    实测一场 13 开场染 384 张图 = 768 次 getImageData（主图 + 遮罩各一次），
        //    合计 12757ms 主线程阻塞——这就是「13 有点卡」的真凶，不是索敌也不是渲染
        //    （稳态实测 step 0.8ms + render 3.1ms，仅占 60fps 预算 23%）。
        if (!this.tempCanvas) {
            this.tempCanvas = document.createElement('canvas');
            this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
        }
        if (!this.maskCanvas) {
            this.maskCanvas = document.createElement('canvas');
            this.maskCtx = this.maskCanvas.getContext('2d', { willReadFrequently: true });
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

        // AoE2 DE 原生玩家色渲染，两个来源各司其职，别混为一谈：
        //   ① 明暗 ← main 图灰阶。main 玩家色区是「有明暗的灰色占位」（褶皱高光→灰白、阴影→灰黑）。
        //      ⚠️ 之前误用遮罩 alpha 做明暗 → 披风变成无褶皱的纯色方块（血训 08-15）。这条教训依然成立，
        //         明暗只能来自 main 灰阶，绝不要改回去用 alpha。
        //   ② 覆盖权重 ← 遮罩 alpha。
        //      🔴 [2026-08-17] 但当年连带把 alpha 的「权重」用途也一起弃用了（退化成 alpha>0 的布尔判断），
        //         那是矫枉过正。实测 .pc.png：RGB 恒为纯白 (255,255,255)，alpha 是 13~255 的连续梯度，
        //         且与 main 灰阶的相关系数仅 0.11 / -0.009 / 0.16（冠军剑士/骑士/游侠）——两者互不相关，
        //         证明 alpha 编码的是另一个维度：玩家色的覆盖强度（中心实覆盖 255，边缘渐降做过渡带）。
        //         二值化等于把 DE 做好的过渡带削成硬边，披风/马披糊成一整块纯色，即所谓「塑料单色感」。
        //         恢复按权重混合后，褶皱层次与金属高光都回来了（对比图见 scripts/tint_experiment.cjs）。
        //   增益 2.2：把 main 灰阶提亮到接近 AoE2「高光耀眼/阴影分明」的对比度。
        //      注：原注释称 main 灰阶均值 ~42，实测为 48~90（因兵种而异），但 2.2 的实际观感经对比图验证仍最好，
        //      故保持不变；试过配 gamma 色阶曲线替代，在暗底兵种（条顿骑士均值 48）上反而更闷，已否决。
        const GAIN = 2.2;
        const n = Math.min(main.length, maskData.length);
        for (let i = 0; i < n; i += 4) {
            const w = maskData[i + 3] / 255;   // 玩家色覆盖权重（DE 原生渐变）
            if (w === 0) continue;             // 非玩家色区域（脸/皮肤/金属/武器/马），保持 main 原样

            // main 灰阶 = 布料明暗（褶皱），作为玩家色的亮度调制
            const lum = 0.299 * main[i] + 0.587 * main[i + 1] + 0.114 * main[i + 2];
            const s = Math.min(255, lum * GAIN);
            // 按覆盖权重混回原像素：w=1 纯玩家色，w 越低越保留原色，边缘自然过渡
            main[i] = Math.round((tint.r * s / 255) * w + main[i] * (1 - w));
            main[i + 1] = Math.round((tint.g * s / 255) * w + main[i + 1] * (1 - w));
            main[i + 2] = Math.round((tint.b * s / 255) * w + main[i + 2] * (1 - w));
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
            // 🔴 与 applyMaskTint 里那处必须一致：tempCanvas 是两个方法共用的，
            //    谁先初始化谁定 context。少写一处，先跑到的那条路径就会创建不带
            //    willReadFrequently 的 context，另一处的修复被静默绕过。
            this.tempCtx = this.tempCanvas.getContext('2d', { willReadFrequently: true });
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
