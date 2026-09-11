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
import SpriteTintWorker from '../../workers/SpriteTintWorker?worker';
import { tintMaskPixels } from './MaskTintPixels';

export type TintedSprite = HTMLImageElement | (ImageBitmap & {
    naturalWidth: number; naturalHeight: number; complete: true; src: string;
});

/**
 * 缓存键用的稳定标识：优先源文件路径（`sourceUrl`），退回 `src`。
 *
 * 🔴 13 的素材抠绿后 `src` 是 data URL（实测单张 0.81MB），直接当 Map key 会让每条缓存
 *    额外背一份与位图同量级的字符串。`sourceUrl` 由 Scene13WarLayer 在抠绿时挂上，
 *    指向原始 png 路径；大地图那批素材没抠绿，`src` 本身就是短路径，退回即可。
 */
function tintKeyOf(img: HTMLImageElement): string {
    // 🔴 [2026-08-31 修键碰撞] 带 `sourceUrl` 的是**战术模式抠绿后**的图，
    //    不带的是战略地图直接加载的**原始 PNG**。两者的 sourceUrl / src 可能是**同一个路径**
    //    （同一份素材两处都在用），只取路径当 key 会让它们互相顶掉：
    //    战略地图可能拿到抠过绿的版本、战术模式可能拿到带绿幕的版本。
    //    加前缀区分来源，两条链路各存各的。
    const src = (img as any).sourceUrl;
    return src ? `de:${src}` : `raw:${img.src}`;
}

/** 估算一张图占的堆字节：解码位图 w×h×4，加上 src 字符串（data URL 时非常大，UTF-16 2 字节/字符）。 */
function imgBytes(img: TintedSprite): number {
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
    private static tintedSpriteCache: Map<string, TintedSprite> = new Map();
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
    /**
     * 600 → 1600MB（2026-08-31）。
     *
     * ⚠️ **这次调参的收益从未被证实，别拿它当成功案例照抄。**
     *    当时的理由是「缓存顶死在 599.6/600MB ⇒ 整场在反复淘汰又重染」——
     *    但「顶死」是观察，「反复重染」是**我猜的**。当天补了 churn 计数器后实测：
     *    `reAdds` 一直是 **0**，从来没有条目被淘汰后又加回来，**根本没抖动**。
     *    同一天真正治好卡顿的是开机改按需加载（见 LegionPhalanxDrawer.EAGER_BOOT_UNIT_IDS），
     *    不是这里抬预算。
     *
     * 现在为什么还留在 1600：实测单场工作集 **774MB**，确实大于旧预算 600MB，
     *    留着能让淘汰变成罕见事件（现测 `evicts:0`）；代价是多占内存。
     *    **谁要再动这个数，先看 PerfDoctor 报告里本项的 `churn.reAdds`**：
     *    还是 0 就说明没抖动，抬预算不会带来任何性能收益，只会白吃内存。
     */
    private static readonly TINTED_CACHE_MAX_BYTES = 1600 * 1024 * 1024;
    /** 当前染色缓存已占字节（随写入/淘汰增减，避免每次淘汰都重新遍历统计）。 */
    private static tintedCacheBytes = 0;

    // 玩家色遮罩缓存：maskSrc -> Image（加载中/完成）或 'none'（确认无遮罩）
    private static maskCache: Map<string, HTMLImageElement | 'none'> = new Map();
    /** 遮罩图缓存**字节**预算（理由同 TINTED_CACHE_MAX_BYTES：遮罩与主图同尺寸，条数上限一样失真）。 */
    /** 同上：实测单场顶死在 300MB 说明不够用，放到 700MB 让它装得下一整场。 */
    private static readonly MASK_CACHE_MAX_BYTES = 700 * 1024 * 1024;
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
    ): TintedSprite {
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
    private static readyInflight: Map<string, Promise<TintedSprite>> = new Map();
    private static tintWorker: Worker | null = null;
    private static workerFailed = false;
    private static workerJobId = 0;
    private static workerJobs = new Map<number, { resolve: (bitmap: ImageBitmap) => void; reject: (error: Error) => void }>();
    private static workerBusy = 0;
    private static workerWaiters: Array<{ key: string; resume: () => void }> = [];
    private static criticalTintKeys = new Set<string>();
    private static workerTintKeys = new Set<string>();

    private static getTintWorker(): Worker {
        if (this.tintWorker) return this.tintWorker;
        const worker = new SpriteTintWorker();
        worker.onmessage = ({ data }) => {
            const job = this.workerJobs.get(data.id);
            if (!job) return;
            this.workerJobs.delete(data.id);
            if (data.error) job.reject(new Error(data.error));
            else job.resolve(data.bitmap);
        };
        worker.onerror = () => {
            this.workerFailed = true;
            worker.terminate();
            this.tintWorker = null;
            for (const job of this.workerJobs.values()) job.reject(new Error('染色 Worker 不可用'));
            this.workerJobs.clear();
        };
        this.tintWorker = worker;
        return worker;
    }

    private static async tintReadyInWorker(sprite: HTMLImageElement, factionId: string): Promise<TintedSprite> {
        if (this.workerFailed || typeof Worker === 'undefined' || typeof OffscreenCanvas === 'undefined'
            || typeof createImageBitmap === 'undefined') return this.tintReadyUncached(sprite, factionId);
        const tint = FactionTintSystem.getTintColor(factionId);
        if (!tint) return sprite;
        const source = (sprite as any).sourceUrl || sprite.src;
        const dir = source.slice(0, source.lastIndexOf('/') + 1);
        if (this.dirHasMask.get(dir) === false) return this.tintReadyUncached(sprite, factionId);
        const maskSrc = source.replace(/\.png$/, '.pc.png');
        let mask = this.maskCache.get(maskSrc);
        if (!mask) {
            const image = new Image();
            image.fetchPriority = this.criticalTintKeys.has(`${tintKeyOf(sprite)}_${factionId}`) ? 'high' : 'low';
            image.onload = () => { this.maskCachePut(maskSrc, image); this.dirHasMask.set(dir, true); };
            image.onerror = () => {
                this.maskCachePut(maskSrc, 'none');
                if (this.dirHasMask.get(dir) !== true) this.dirHasMask.set(dir, false);
            };
            image.src = maskSrc;
            this.maskCachePut(maskSrc, image);
            mask = image;
        }
        if (mask === 'none') return this.tintReadyUncached(sprite, factionId);
        if (!mask.complete) await new Promise<void>(resolve => {
            const done = () => { mask.removeEventListener('load', done); mask.removeEventListener('error', done); resolve(); };
            mask.addEventListener('load', done); mask.addEventListener('error', done);
            if (mask.complete) done();
        });
        if (!mask.naturalWidth) return this.tintReadyUncached(sprite, factionId);
        const key = `mask:${tintKeyOf(sprite)}_${factionId}_${FactionTintSystem.getTintHex(factionId) ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(key);
        if (cached) {
            await this.imageExports.get(cached);
            if (cached instanceof HTMLImageElement && !cached.complete) await cached.decode();
            if (cached.naturalWidth) { this.touchTinted(key, cached); return cached; }
        }
        // 限制在途位图，避免几百张雪碧图同时复制占满内存。
        this.workerTintKeys.add(key);
        const flightKey = `${tintKeyOf(sprite)}_${factionId}`;
        if (this.workerBusy >= 2) await new Promise<void>(resume => this.workerWaiters.push({ key: flightKey, resume }));
        else this.workerBusy++;
        let mainBitmap: ImageBitmap | null = null, maskBitmap: ImageBitmap | null = null;
        try {
            if (this.workerFailed) throw new Error('染色 Worker 不可用');
            mainBitmap = await createImageBitmap(sprite);
            maskBitmap = await createImageBitmap(mask);
            const worker = this.getTintWorker();
            const id = ++this.workerJobId;
            const bitmap = await new Promise<ImageBitmap>((resolve, reject) => {
                this.workerJobs.set(id, { resolve, reject });
                try {
                    worker.postMessage({ id, sprite: mainBitmap, mask: maskBitmap, tint,
                        weakCoverage: this.WEAK_PC_COVERAGE, extraTint: this.WEAK_EXTRA_TINT }, [mainBitmap!, maskBitmap!]);
                } catch (error) { this.workerJobs.delete(id); reject(error); }
            });
            // 可直接 drawImage 的位图，不再经历 PNG 编码 → 图片解码往返。
            const image = Object.assign(bitmap, { naturalWidth: bitmap.width, naturalHeight: bitmap.height,
                complete: true as const, src: '' });
            this.tintedCachePut(key, image);
            return this.tintedSpriteCache.get(key) ?? image;
        } finally {
            this.workerTintKeys.delete(key);
            mainBitmap?.close(); maskBitmap?.close();
            // 行走/攻击先完成，不能让开场等在尚未使用的死亡、残局动作后面。
            const critical = this.workerWaiters.findIndex(waiter => this.criticalTintKeys.has(waiter.key));
            const next = this.workerWaiters.splice(critical < 0 ? 0 : critical, 1)[0];
            if (next) next.resume(); else this.workerBusy--;
        }
    }
    private static imageExports = new WeakMap<TintedSprite, Promise<void>>();
    private static tintWork: Array<() => void> = [];
    private static tintWorkScheduled = false;

    /** 限制实际像素处理，而不是限制遮罩网络请求的启动次数。 */
    private static scheduleTint<T>(work: () => T): Promise<T> {
        return new Promise((resolve, reject) => {
            this.tintWork.push(() => {
                try { resolve(work()); } catch (error) { reject(error); }
            });
            if (this.tintWorkScheduled) return;
            this.tintWorkScheduled = true;
            const drain = () => {
                const deadline = performance.now() + 4;
                do { this.tintWork.shift()?.(); }
                while (this.tintWork.length && performance.now() < deadline);
                // 切换期浏览器合成繁忙时 rAF 很稀疏，不能让素材加载等下一张画面才推进。
                // 每个短任务后让回事件循环，输入/绘制仍有机会执行。
                if (this.tintWork.length) setTimeout(drain, 0);
                else this.tintWorkScheduled = false;
            };
            setTimeout(drain, 0);
        });
    }

    /** toBlob 在调用时快照画布；后续染色可安全复用画布，避免同步 PNG/base64 编码。 */
    private static exportCanvas(canvas: HTMLCanvasElement, fallback: HTMLImageElement): HTMLImageElement {
        const img = new Image();
        const ready = new Promise<void>((resolve) => {
            let objectUrl: string | null = null;
            const finish = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                img.removeEventListener('load', finish);
                img.removeEventListener('error', failed);
                resolve();
            };
            const failed = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                objectUrl = null;
                img.removeEventListener('error', failed);
                img.addEventListener('error', finish, { once: true });
                img.src = fallback.src;
            };
            img.addEventListener('load', finish, { once: true });
            img.addEventListener('error', failed, { once: true });
            try {
                canvas.toBlob(blob => {
                    if (!blob) { failed(); return; }
                    objectUrl = URL.createObjectURL(blob);
                    img.src = objectUrl;
                }, 'image/png');
            } catch { failed(); }
        });
        this.imageExports.set(img, ready);
        void ready.then(() => this.imageExports.delete(img));
        return img;
    }

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
        factionId: string,
        critical = false
    ): Promise<TintedSprite> {
        if (!FactionTintSystem.shouldTint(factionId)) return originalSprite;
        const flightKey = `${tintKeyOf(originalSprite)}_${factionId}`;
        if (critical) this.criticalTintKeys.add(flightKey);
        const flying = this.readyInflight.get(flightKey);
        if (flying) return flying;
        const job = this.tintReadyInWorker(originalSprite, factionId)
            .catch(() => this.tintReadyUncached(originalSprite, factionId))
            .finally(() => { this.readyInflight.delete(flightKey); this.criticalTintKeys.delete(flightKey); });
        this.readyInflight.set(flightKey, job);
        return job;
    }

    /** getTintedSpriteReady 的实体（去重壳见上）。 */
    private static async tintReadyUncached(
        originalSprite: HTMLImageElement,
        factionId: string
    ): Promise<TintedSprite> {
        let tinted = await this.scheduleTint(() => this.getTintedSprite(originalSprite, factionId));
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
            tinted = await this.scheduleTint(() => this.getTintedSprite(originalSprite, factionId));
        }

        // 同步绘制入口在编码中返回原图；战术素材库必须等最终染色图解码完成。
        const suffix = `${tintKeyOf(originalSprite)}_${factionId}_${FactionTintSystem.getTintHex(factionId) ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(`mask:${suffix}`) ?? this.tintedSpriteCache.get(suffix);
        if (cached) {
            await this.imageExports.get(cached);
            tinted = cached;
        }

        if (tinted instanceof HTMLImageElement && !tinted.complete) {
            const image = tinted;
            await new Promise<void>((resolve) => {
                const done = () => resolve();
                image.addEventListener('load', done, { once: true });
                image.addEventListener('error', done, { once: true });
                if (image.complete) resolve();
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
    /**
     * LRU「用过就移到队尾」。
     *
     * 🔴 [2026-08-31] 原来的淘汰是**纯 FIFO**（按插入先后），与「谁正在被用」无关。
     *    后果：打完一场 13，染色缓存被战场素材塞到 600MB 预算上限（实测 587.9MB/115 条），
     *    回到战略地图后每插入一张士兵贴图就淘汰最旧的 —— 而最旧的往往正是**上一帧刚用过的
     *    那批士兵贴图**，于是每帧都在重新染色、每帧拿到的都是还没解码的新图，
     *    军团士兵就一直画不出来。改成 LRU：正在用的那批永远排在队尾，不会被顶掉。
     */
    private static touchTinted(key: string, img: TintedSprite): void {
        this.tintedSpriteCache.delete(key);
        this.tintedSpriteCache.set(key, img);
    }

    private static tintedCachePut(key: string, img: TintedSprite): void {
        if (this.tintedSpriteCache.has(key)) return;
        if (this.evictedTintKeys.delete(key)) this.churnStats.tintedReAdds++;
        let counted = imgBytes(img);
        this.tintedSpriteCache.set(key, img);
        this.tintedCacheBytes += counted;
        if (img instanceof HTMLImageElement && (!img.complete || img.naturalWidth === 0)) {
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

    /**
     * 抖动计数（2026-08-31）。
     * 「缓存顶在预算上」本身**不能**证明有问题 —— 淘汰冷条目是健康行为。
     * 只有「淘汰掉的又被加回来」才是抖动。`evictedKeys` 记住被淘汰过的 key，
     * 下次同 key 再进来就记一笔 reAdd。上限 4000 个 key（几十字节/个，可忽略）。
     */
    private static churnStats = { tintedEvicts: 0, tintedReAdds: 0, maskEvicts: 0, maskReAdds: 0 };
    private static evictedTintKeys = new Set<string>();
    private static evictedMaskKeys = new Set<string>();
    private static rememberEvicted(set: Set<string>, key: string): void {
        if (set.size > 4000) set.clear();   // 只为统计，清空最多让比例暂时偏低，不影响功能
        set.add(key);
    }
    public static debugChurnTinted(): { evicts: number; reAdds: number } {
        return { evicts: this.churnStats.tintedEvicts, reAdds: this.churnStats.tintedReAdds };
    }
    public static debugChurnMask(): { evicts: number; reAdds: number } {
        return { evicts: this.churnStats.maskEvicts, reAdds: this.churnStats.maskReAdds };
    }

    private static evictTinted(): void {
        while (this.tintedCacheBytes > this.TINTED_CACHE_MAX_BYTES && this.tintedSpriteCache.size > 1) {
            const oldest = this.tintedSpriteCache.keys().next().value;
            if (oldest === undefined) break;
            const victim = this.tintedSpriteCache.get(oldest);
            this.tintedSpriteCache.delete(oldest);
            if (victim) this.tintedCacheBytes -= imgBytes(victim);
            this.churnStats.tintedEvicts++;
            this.rememberEvicted(this.evictedTintKeys, oldest);
        }
        if (this.tintedSpriteCache.size === 0) this.tintedCacheBytes = 0;
    }

    /** 遮罩缓存按字节预算 FIFO 淘汰（`'none'` 这种哨兵值不占字节）。 */
    private static maskCachePut(key: string, val: HTMLImageElement | 'none'): void {
        if (this.maskCache.has(key)) { this.maskCache.set(key, val); return; }
        if (this.evictedMaskKeys.delete(key)) this.churnStats.maskReAdds++;
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
            this.churnStats.maskEvicts++;
            this.rememberEvicted(this.evictedMaskKeys, oldest);
        }
    }

    private static getMaskTinted(
        sprite: HTMLImageElement,
        maskSrc: string,
        factionId: string,
        tint: TintColor,
        tintHex: string | null,
        dir = ''
    ): TintedSprite {
        // 🔴 [2026-08-30 修 13 卡顿·堆撞 4GB 天花板] key 必须用**源路径**，不能用 sprite.src。
        //    13 的素材经抠绿后 src 是 data URL，实测单张 **0.81MB**（576 张共 468MB）。
        //    拿它当 Map 的 key，等于每条缓存额外背一个 0.81MB 的字符串；
        //    上限 4000 条 → 光 key 就 3.2GB，和位图本身一样大，直接把堆推到 jsHeapSizeLimit(4096MB)。
        //    换成 sourceUrl（几十字节）后 key 开销归零；顺带把「同一源图被并发加载出多个 clean 副本」
        //    （8 方向共用同一文件时必然发生）合并成同一条缓存，少染 7 次、少存 7 份位图。
        const cacheKey = `mask:${tintKeyOf(sprite)}_${factionId}_${tintHex ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(cacheKey);
        if (cached && cached.complete && cached.naturalWidth > 0 && !this.imageExports.has(cached)) { this.touchTinted(cacheKey, cached); return cached; }
        // 🔴 [2026-08-31 修「军团士兵不显示」] 已在缓存但**还没解码完**：直接返回**原图**，
        //    绝不再新建一张。调用方（LegionPhalanxDrawer:1425）拿到结果**不检查 .complete**
        //    就去算帧、drawImage —— 未解码图 naturalWidth = 0，帧数算成 0，整格什么都画不出来。
        //    返回原图最多是「这一瞬间没染上势力色」，比整支军团消失好得多。
        if (cached) return sprite;

        // 战术异步请求已接管同一张图，不让战略绘制入口重复在主线程染一次。
        if (this.workerTintKeys.has(cacheKey)) return sprite;

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
            return sprite;
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
    ): TintedSprite {
        // key 用源路径而非 data URL，理由同 getMaskTinted（见那里的长注释）。
        const cacheKey = `${tintKeyOf(sprite)}_${factionId}_${tintHex ?? 'raw'}`;
        const cached = this.tintedSpriteCache.get(cacheKey);
        if (cached && cached.complete && cached.naturalWidth > 0 && !this.imageExports.has(cached)) { this.touchTinted(cacheKey, cached); return cached; }
        if (cached) return sprite;   // 同上：未解码时回退原图，别让调用方拿到 naturalWidth=0 的图

        // 如果原图未加载完成，返回原图
        if (!sprite.complete || sprite.naturalWidth === 0) return sprite;

        const tintedSprite = this.applyTint(sprite, tint);
        this.tintedCachePut(cacheKey, tintedSprite);
        return sprite;
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
        const weak = tintMaskPixels(main, maskData, tint,
            this.WEAK_PC_COVERAGE, this.WEAK_EXTRA_TINT, this.weakCoverCache.get(maskSrc));
        this.weakCoverCache.set(maskSrc, weak);

        ctx.putImageData(mainImageData, 0, 0);

        return this.exportCanvas(canvas, sprite);
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

        return this.exportCanvas(canvas, sprite);
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
                promises.push(this.getTintedSpriteReady(sprite, factionId).then(() => {}));
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
        churn: () => SpriteTinter.debugChurnTinted(),
    });
    perfDoctor.registerCache({
        name: 'SpriteTinter:maskCache(玩家色遮罩)',
        where: 'src/systems/tinting/SpriteTinter.ts:MASK_CACHE_MAX_BYTES',
        entries: () => SpriteTinter.debugMaskCacheSize(),
        bytes: () => SpriteTinter.debugMaskCacheBytes(),
        limitKind: 'bytes',
        limitValue: SpriteTinter.debugMaskCacheLimit(),
        churn: () => SpriteTinter.debugChurnMask(),
    });
}
