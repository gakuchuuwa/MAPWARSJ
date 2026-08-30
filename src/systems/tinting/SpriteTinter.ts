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
import { perfDoctor } from '../../debug/PerfDoctor';

/**
 * 缓存键用的稳定标识：优先源文件路径（`sourceUrl`），退回 `src`。
 *
 * 🔴 13 的素材抠绿后 `src` 是 data URL（实测单张 0.81MB），直接当 Map key 会让每条缓存
 *    额外背一份与位图同量级的字符串。`sourceUrl` 由 Scene13WarLayer 在抠绿时挂上，
 *    指向原始 png 路径；大地图那批素材没抠绿，`src` 本身就是短路径，退回即可。
 */
function tintKeyOf(img: HTMLImageElement): string {
    return (img as any).sourceUrl || img.src;
}

/** 估算一张图占的堆字节：解码位图 w×h×4，加上 src 字符串（data URL 时非常大，UTF-16 2 字节/字符）。 */
function imgBytes(img: HTMLImageElement): number {
    const px = (img.naturalWidth || 0) * (img.naturalHeight || 0) * 4;
    const src = img.src && img.src.startsWith('data:') ? img.src.length * 2 : 0;
    return px + src;
}


/**
 * 精灵染色器
 */
export class SpriteTinter {
    /** 玩家色覆盖率低于此值 = 缩到战场尺寸后认不出阵营（实测 306 个目录里 30 个，约 9%） */
    private static readonly WEAK_PC_COVERAGE = 0.10;
    /** 低覆盖兵种全身额外混入的势力色比例（保留自身明暗，金属/皮肤只略微偏色） */
    private static readonly WEAK_EXTRA_TINT = 0.15;
    /** 「玩家色覆盖是否过低」的判定缓存（key = 遮罩 URL；同一遮罩两阵营共用，只算一次） */
    private static weakCoverCache: Map<string, boolean> = new Map();

    // 缓存染色后的精灵图，避免每帧重复处理
    // Key: `${originalSrc}_${factionId}`；mask 染色的 key 前缀 `mask:` 区分
    private static tintedSpriteCache: Map<string, HTMLImageElement> = new Map();
    /**
     * 染色图缓存**字节**预算。
     *
     * 🔴 [2026-08-30 修 13 卡顿] 原来是「4000 条」的条数上限，注释里按一张 64KB 估的。
     *    实测完全不是这个量级：DE strip 解码后**平均 0.90MB、p90 1.85MB**，
     *    单场 13 的 576 张染色图就占 **876MB 位图 + 468MB data URL**。
     *    按条数记 4000 条 = 名义 6GB，而浏览器 `jsHeapSizeLimit` 只有 **4096MB**
     *    （探针实测堆峰值 3822MB，已经贴着天花板 → major GC 连轴转，
     *    帧率从 8-18 的中位 56fps 掉到 8-30 的 23fps，而 13 自己的 step+render 只占 5ms）。
     *    改成按**实际字节**淘汰，预算才有意义。
     *
     *    600MB 的取法：单场工作集（bank 强引用，缓存管不着）约 760MB，
     *    缓存再留 600MB 可覆盖上一场的常见兵种，两者相加 ~1.4GB，离 4GB 有充足余量。
     */
    private static readonly TINTED_CACHE_MAX_BYTES = 600 * 1024 * 1024;
    /** 当前染色缓存已占字节（随写入/淘汰增减，避免每次淘汰都重新遍历统计）。 */
    private static tintedCacheBytes = 0;

    // 玩家色遮罩缓存：maskSrc -> Image（加载中/完成）或 'none'（确认无遮罩）
    private static maskCache: Map<string, HTMLImageElement | 'none'> = new Map();
    /** 遮罩图缓存**字节**预算（理由同 TINTED_CACHE_MAX_BYTES：遮罩与主图同尺寸，条数上限一样失真）。 */
    private static readonly MASK_CACHE_MAX_BYTES = 300 * 1024 * 1024;
    /** 当前遮罩缓存已占字节。 */
    private static maskCacheBytes = 0;
    /**
     * **目录级**「这个素材目录有没有玩家色遮罩」的判定缓存（key = 目录前缀，如 `/SUCAI/S10DB/`）。
     *
     * 2026-08-18 删掉手工白名单、改成运行时探测之后，如果只按**单张图**缓存判定，代价有两条：
     *   ① S10DB 老素材有 931 张图且一张遮罩都没有 → 每张都要先发一次 404 才知道没有；
     *   ② 探测往返期间 `getMaskTinted` 返回**未染色原图**，于是老兵种在那个窗口里
     *      整批以原色出现（本地几毫秒看不出来，线上一次往返几十~两百毫秒就看得出来）。
     * 按目录记一次就够：S10DB 整个目录只探一次，之后同目录所有图直接走亮度染色，
     * 两个代价一起消掉，且「新素材自动生效、永不再漏」的好处原样保留。
     */
    private static dirHasMask: Map<string, boolean> = new Map();

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
        // 🔴 [2026-08-18 根治] 不再用 MASK_DIRS 白名单（手工同步老大难，漏登记=白方块）。
        //   对所有素材直接尝试 .pc.png 遮罩：有遮罩 → mask 精确染色；无遮罩（S10DB/帝国征服原版）
        //   → getMaskTinted 内部 onerror 置 'none' → 自动回亮度染色。新提取素材永不再漏。
        const sourceUrl: string = (originalSprite as any).sourceUrl || originalSprite.src;
        const dir = sourceUrl.slice(0, sourceUrl.lastIndexOf('/') + 1);
        // 该目录已确认没有遮罩（探测过一次）→ 直接走亮度染色，不再逐张发 404（见 dirHasMask）
        if (this.dirHasMask.get(dir) === false) {
            return this.getLuminanceTinted(originalSprite, factionId, tintColor, tintHex);
        }
        const maskSrc = sourceUrl.replace(/\.png$/, '.pc.png');
        return this.getMaskTinted(originalSprite, maskSrc, factionId, tintColor, tintHex, dir);
    }

    /** 同一「图 × 势力」的**在途染色**去重表（见 getTintedSpriteReady 的说明）。 */
    private static readyInflight: Map<string, Promise<HTMLImageElement>> = new Map();

    /**
     * 等待玩家色遮罩完成探测后再返回最终染色图。
     * 战术模式会把返回帧长期存入本场素材库，不能接受 getTintedSprite 首次探测时的原图占位。
     *
     * 🔴 [2026-08-30 修 13 卡顿] 必须按「图 × 势力」做**在途去重**，光有结果缓存不够：
     *    13 一次会为同一张图并发发起 8 次（8 个方向共用同一文件时），8 个调用同时卡在
     *    「等 .pc.png 遮罩」这一步；遮罩一到，8 个一起醒来、一起发现缓存还是空的，
     *    于是各自跑一遍 applyMaskTint（两次 getImageData 逐像素 + 一次 PNG 编码），
     *    产出 8 份**内容完全相同**的位图，最后只有一份进缓存、其余 7 份被 bank 长期强引用。
     *    实测这条占单场素材内存的 **26%**。加了在途表后，8 个调用共享同一个 Promise、同一个结果对象。
     */
    public static async getTintedSpriteReady(
        originalSprite: HTMLImageElement,
        factionId: string
    ): Promise<HTMLImageElement> {
        if (!FactionTintSystem.shouldTint(factionId)) return originalSprite;
        const flightKey = `${tintKeyOf(originalSprite)}_${factionId}`;
        const flying = this.readyInflight.get(flightKey);
        if (flying) return flying;
        const job = this.tintReadyUncached(originalSprite, factionId)
            .finally(() => { this.readyInflight.delete(flightKey); });
        this.readyInflight.set(flightKey, job);
        return job;
    }

    /** getTintedSpriteReady 的实体（去重壳见上）。 */
    private static async tintReadyUncached(
        originalSprite: HTMLImageElement,
        factionId: string
    ): Promise<HTMLImageElement> {
        let tinted = this.getTintedSprite(originalSprite, factionId);
        if (!FactionTintSystem.shouldTint(factionId)) return tinted;

        const sourceUrl: string = (originalSprite as any).sourceUrl || originalSprite.src;
        const dir = sourceUrl.slice(0, sourceUrl.lastIndexOf('/') + 1);
        if (this.dirHasMask.get(dir) !== false) {
            const maskSrc = sourceUrl.replace(/\.png$/, '.pc.png');
            const maskState = this.maskCache.get(maskSrc);
            if (maskState && maskState !== 'none' && !maskState.complete) {
                await new Promise<void>((resolve) => {
                    const done = () => resolve();
                    maskState.addEventListener('load', done, { once: true });
                    maskState.addEventListener('error', done, { once: true });
                    if (maskState.complete) resolve();
                });
            }
            // 遮罩成功则生成精确玩家色；确认不存在则在这里稳定回退亮度染色。
            tinted = this.getTintedSprite(originalSprite, factionId);
        }

        if (!tinted.complete) {
            await new Promise<void>((resolve) => {
                const done = () => resolve();
                tinted.addEventListener('load', done, { once: true });
                tinted.addEventListener('error', done, { once: true });
                if (tinted.complete) resolve();
            });
        }
        return tinted;
    }

    /**
     * mask 染色入口（帝国决定 DE 素材，有玩家色遮罩）。
     * 遮罩惰性加载：首帧返回原图（玩家色区域暂灰），遮罩就绪后精确染色并缓存。
     */
    /**
     * 按**字节预算**的 FIFO 淘汰写入（Map 天然保持插入序）。
     *
     * 🔴 图是异步解码的：写入这一刻 `naturalWidth` 往往还是 0，此时 `imgBytes` 只能算出
     *    src 字符串那部分。所以尺寸就绪后要把差额补记上（`load` 一次性回调），
     *    否则预算会被严重低估、等于没有上限。
     */
    private static tintedCachePut(key: string, img: HTMLImageElement): void {
        if (this.tintedSpriteCache.has(key)) return;
        let counted = imgBytes(img);
        this.tintedSpriteCache.set(key, img);
        this.tintedCacheBytes += counted;
        if (!img.complete || img.naturalWidth === 0) {
            img.addEventListener('load', () => {
                // 仍在缓存里才补记，已被淘汰的不再计入（否则字节数会漂）
                if (this.tintedSpriteCache.get(key) !== img) return;
                const real = imgBytes(img);
                this.tintedCacheBytes += real - counted;
                counted = real;
                this.evictTinted();
            }, { once: true });
        }
        this.evictTinted();
    }

    private static evictTinted(): void {
        while (this.tintedCacheBytes > this.TINTED_CACHE_MAX_BYTES && this.tintedSpriteCache.size > 1) {
            const oldest = this.tintedSpriteCache.keys().next().value;
            if (oldest === undefined) break;
            const victim = this.tintedSpriteCache.get(oldest);
            this.tintedSpriteCache.delete(oldest);
            if (victim) this.tintedCacheBytes -= imgBytes(victim);
        }
        if (this.tintedSpriteCache.size === 0) this.tintedCacheBytes = 0;
    }

    /** 遮罩缓存按字节预算 FIFO 淘汰（`'none'` 这种哨兵值不占字节）。 */
    private static maskCachePut(key: string, val: HTMLImageElement | 'none'): void {
        if (this.maskCache.has(key)) { this.maskCache.set(key, val); return; }
        this.maskCache.set(key, val);
        if (val === 'none') return;
        let counted = imgBytes(val);
        this.maskCacheBytes += counted;
        if (!val.complete || val.naturalWidth === 0) {
            val.addEventListener('load', () => {
                if (this.maskCache.get(key) !== val) return;
                const real = imgBytes(val);
                this.maskCacheBytes += real - counted;
                counted = real;
                this.evictMask();
            }, { once: true });
        }
        this.evictMask();
    }

    private static evictMask(): void {
        while (this.maskCacheBytes > this.MASK_CACHE_MAX_BYTES && this.maskCache.size > 1) {
            const oldest = this.maskCache.keys().next().value;
            if (oldest === undefined) break;
            const victim = this.maskCache.get(oldest);
            this.maskCache.delete(oldest);
            if (victim && victim !== 'none') this.maskCacheBytes -= imgBytes(victim);
        }
    }

    private static getMaskTinted(
        sprite: HTMLImageElement,
        maskSrc: string,
        factionId: string,
        tint: TintColor,
        tintHex: string | null,
        dir = ''
    ): HTMLImageElement {
        // 🔴 [2026-08-30 修 13 卡顿·堆撞 4GB 天花板] key 必须用**源路径**，不能用 sprite.src。
        //    13 的素材经抠绿后 src 是 data URL，实测单张 **0.81MB**（576 张共 468MB）。
        //    拿它当 Map 的 key，等于每条缓存额外背一个 0.81MB 的字符串；
        //    上限 4000 条 → 光 key 就 3.2GB，和位图本身一样大，直接把堆推到 jsHeapSizeLimit(4096MB)。
        //    换成 sourceUrl（几十字节）后 key 开销归零；顺带把「同一源图被并发加载出多个 clean 副本」
        //    （8 方向共用同一文件时必然发生）合并成同一条缓存，少染 7 次、少存 7 份位图。
        const cacheKey = `mask:${tintKeyOf(sprite)}_${factionId}_${tintHex ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(cacheKey);
        if (cached && cached.complete) return cached;

        const maskState = this.maskCache.get(maskSrc);
        if (maskState === 'none') {
            // 🔴 [2026-08-20] 分两种情况，别一律回亮度染色：
            //   ① **本目录别的图有遮罩、只有这一张缺** → 返回原图不染色。
            //      全项目只有 WAR_ELEPHANT / COMPANION_CAVALRY / CRETAN_ARCHER 三个兵种有 damage 动作组，
            //      而这三个的 damage 遮罩一张都没提取出来。若这里回亮度染色，受伤那几帧会从
            //      「只染毯子牙饰」跳成「整只象按亮度混势力色」—— 一挨打就变色，比丢掉几帧势力色难看得多。
            //      返回原图的代价只是 damage 那几帧毯子暂时没有势力色（占幅 11~19%），几乎看不出。
            //   ② **整个目录都没有遮罩**（S10DB / 征服版 SLP 那批）→ 照旧亮度染色，
            //      它们全靠这条才有势力色，绝不能改成不染。
            if (dir && this.dirHasMask.get(dir) === true) return sprite;
            return this.getLuminanceTinted(sprite, factionId, tint, tintHex);
        }
        if (maskState && maskState.complete) {
            // 遮罩就绪 → mask 精确染色
            if (!sprite.complete || sprite.naturalWidth === 0) return sprite;
            const tinted = this.applyMaskTint(sprite, maskState, tint, maskSrc);
            this.tintedCachePut(cacheKey, tinted);
            return tinted;
        }
        // 首次：发起遮罩加载，本帧返回原图（不染全身，避免脸/皮肤被亮度染色误伤）
        if (!maskState) {
            const m = new Image();
            m.onload = () => { this.maskCachePut(maskSrc, m); if (dir) this.dirHasMask.set(dir, true); };
            m.onerror = () => {
                this.maskCachePut(maskSrc, 'none');
                // 🔴 [2026-08-20 修「象兵颜色时好时坏」] 单张遮罩 404 **不许**把整个目录判成「无遮罩」。
                //   dirHasMask 原本假设「一个目录要么全有遮罩、要么全没有」，但磁盘实测有 3 个目录是混的：
                //   WAR_ELEPHANT / COMPANION_CAVALRY / CRETAN_ARCHER 各缺 damage_0~7 这 8 张 .pc.png，
                //   其余 32 张（move/idle/attack/death）都有。
                //   于是战象一挨打播 damage 帧 → 那 8 张 404 → 整个目录降级 → 之后**全场所有战象**
                //   从「只染毯子牙饰」突变成「整只象按亮度混势力色」，而且 dirHasMask 是 static、
                //   缓存不回滚 = 不可逆。主人看到的「有时颜色不一样」就是这个，与朝向无关，是「受没受过伤」。
                //   改法：只有**从未成功加载过任何遮罩**的目录才允许标记为无遮罩
                //   （S10DB 那类整目录无遮罩的性能优化照旧生效），已确认有遮罩的目录永不降级。
                if (dir && this.dirHasMask.get(dir) !== true) this.dirHasMask.set(dir, false);
            };
            m.src = maskSrc;
            this.maskCachePut(maskSrc, m);
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
        // key 用源路径而非 data URL，理由同 getMaskTinted（见那里的长注释）。
        const cacheKey = `${tintKeyOf(sprite)}_${factionId}_${tintHex ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(cacheKey);
        if (cached && cached.complete) return cached;

        // 如果原图未加载完成，返回原图
        if (!sprite.complete || sprite.naturalWidth === 0) return sprite;

        const tintedSprite = this.applyTint(sprite, tint);
        this.tintedCachePut(cacheKey, tintedSprite);
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
        tint: TintColor,
        maskSrc: string
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

        // 🔴 [2026-08-17 主人定] 玩家色覆盖太少的兵种，额外叠一层整体淡色。
        //    起因：主人「有的染了红色，有的没染色」。实测 306 个目录的玩家色覆盖率差 30 倍——
        //    条顿骑士 79.9%（整个人通红）、投石车只有 2.6%（一小块布，缩到 40px 根本看不见）。
        //    这是 DE 美术本身的分布，不是漏染；但我们把人缩得比帝国时代小得多，低覆盖的就认不出阵营了。
        //    做法：覆盖率 < WEAK_PC_COVERAGE 时，全身按 WEAK_EXTRA_TINT 的比例混入势力色，
        //    并保留各自的明暗（按像素自身灰阶调制），所以金属/皮肤只是**略微偏色**而不是被涂平。
        //    实测命中 30 个目录（约 9%）：投石车/弩炮/攻城槌/战犬/骑士/游侠/骠骑兵等。
        //    🔴 必须**逐像素全采**，别图省事隔几个采一次：精灵图是横向排帧的，
        //       采样步长会和帧宽产生混叠 —— 实测隔 8 采样把精锐轻标枪兵的 26.0% 采成 8.4%，
        //       154 个边界带目录里误判了 5 个。全采一遍 384 张约 281ms，
        //       再按**遮罩 URL 缓存**（同一张遮罩两个阵营各染一次，缓存后只算一次）就够便宜了。
        let weak = this.weakCoverCache.get(maskSrc);
        if (weak === undefined) {
            let bodyPx = 0, pcPx = 0;
            for (let i = 3; i < n; i += 4) {
                if (main[i] > 16) bodyPx++;
                if (maskData[i] > 16) pcPx++;
            }
            weak = bodyPx > 0 && pcPx / bodyPx < SpriteTinter.WEAK_PC_COVERAGE;
            this.weakCoverCache.set(maskSrc, weak);
        }
        const K = weak ? SpriteTinter.WEAK_EXTRA_TINT : 0;

        for (let i = 0; i < n; i += 4) {
            const w = maskData[i + 3] / 255;   // 玩家色覆盖权重（DE 原生渐变）
            if (w === 0) {
                // 非玩家色区域（脸/皮肤/金属/武器/马）：正常情况保持 main 原样；
                // 低覆盖兵种额外混入一点势力色，好歹能认出是哪一方（见上方 WEAK_* 说明）。
                if (K > 0 && main[i + 3] > 16) {
                    const l0 = (0.299 * main[i] + 0.587 * main[i + 1] + 0.114 * main[i + 2]) / 255;
                    main[i] = Math.round(main[i] * (1 - K) + tint.r * l0 * K);
                    main[i + 1] = Math.round(main[i + 1] * (1 - K) + tint.g * l0 * K);
                    main[i + 2] = Math.round(main[i + 2] * (1 - K) + tint.b * l0 * K);
                }
                continue;
            }

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

    // ── PerfDoctor 体检访问器（私有 static 在类外读不到，这里开只读口子）──
    public static debugTintedCacheSize(): number { return this.tintedSpriteCache.size; }
    public static debugTintedCacheBytes(): number { return this.tintedCacheBytes; }
    public static debugTintedCacheLimit(): number { return this.TINTED_CACHE_MAX_BYTES; }
    public static debugMaskCacheSize(): number { return this.maskCache.size; }
    public static debugMaskCacheBytes(): number { return this.maskCacheBytes; }
    public static debugMaskCacheLimit(): number { return this.MASK_CACHE_MAX_BYTES; }

    /**
     * 清除缓存（当势力颜色改变时调用）
     */
    public static clearCache(): void {
        this.tintedSpriteCache.clear();
        this.tintedCacheBytes = 0;
        this.maskCache.clear();
        this.maskCacheBytes = 0;
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

// [2026-08-31] 染色/遮罩两个缓存登记进 PerfDoctor 体检。
//   这两个是单场 13 里最大的两块（实测单场染色图 876MB 位图 + 468MB data URL 字符串）。
if (import.meta.env.DEV) {
    perfDoctor.registerCache({
        name: 'SpriteTinter:tintedSpriteCache(染色图)',
        where: 'src/systems/tinting/SpriteTinter.ts:TINTED_CACHE_MAX_BYTES',
        entries: () => SpriteTinter.debugTintedCacheSize(),
        bytes: () => SpriteTinter.debugTintedCacheBytes(),
        limitKind: 'bytes',
        limitValue: SpriteTinter.debugTintedCacheLimit(),
    });
    perfDoctor.registerCache({
        name: 'SpriteTinter:maskCache(玩家色遮罩)',
        where: 'src/systems/tinting/SpriteTinter.ts:MASK_CACHE_MAX_BYTES',
        entries: () => SpriteTinter.debugMaskCacheSize(),
        bytes: () => SpriteTinter.debugMaskCacheBytes(),
        limitKind: 'bytes',
        limitValue: SpriteTinter.debugMaskCacheLimit(),
    });
}
