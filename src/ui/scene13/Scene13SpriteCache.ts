import { transposeMapData } from './Scene13GroundLayerGL';
import { perfDoctor } from '../../debug/PerfDoctor';

/** 🔴 上策（2026-08-16 主人定）：抠绿 + Base64 结果跨战斗缓存。
 *  抠绿（getImageData 逐像素去绿幕）+ toDataURL（PNG 编码）是素材处理最耗时的一步，
 *  且只去绿幕、与势力色无关 → 跨战斗、跨势力都能复用。第二次打同样素材跳过抠绿/编码，
 *  只重做染色（势力色每局随机，走 SpriteTinter 现链路）。key = 源图 URL，value = 抠绿后 data URL。
 */
/**
 * 抖动计数（2026-08-31）。
 * 「缓存占用顶在预算上」**不能**证明有问题——淘汰冷条目是健康的。
 * 只有「淘汰掉的又被加回来」（reAdds）才是抖动，才说明预算装不下单场战斗的工作集。
 * 光看 MB 这两种情况长得一模一样，我 8-31 就是因为分不清，把预算从 600 盲抬到 1600MB。
 */
const CHURN = { cleanEvicts: 0, cleanReAdds: 0, decromaEvicts: 0, decromaReAdds: 0 };
const EVICTED_CLEAN = new Set<string>();
const EVICTED_DECROMA = new Set<string>();
function rememberEvicted(set: Set<string>, key: string): void {
    if (set.size > 4000) set.clear();
    set.add(key);
}

let cachedViennaMapData: any = null;
if (typeof window !== 'undefined') {
    fetch('/scratch/rms-out/mapdata_vienna_danube_120.json')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
            if (d) cachedViennaMapData = transposeMapData(d);
        })
        .catch(() => {});
}

export function getCachedViennaMapData(): any {
    return cachedViennaMapData;
}

export function setCachedViennaMapData(d: any): void {
    cachedViennaMapData = d;
}

export const DECROMA_CACHE = new Map<string, string>();
/**
 * 抠绿 data URL 缓存**字节**预算。
 *
 * 🔴 [2026-08-30] 原来是「2000 条」。实测一条 data URL 平均 **0.81MB**（UTF-16 约 1.6MB 堆），
 *    2000 条 = 名义 3.2GB，而浏览器 jsHeapSizeLimit 只有 4096MB。条数上限在这里等于没有上限。
 */
// 🔴 [2026-08-31] 实测顶死在 199MB，同上，放到 500MB。
export const DECROMA_CACHE_MAX_BYTES = 500 * 1024 * 1024;
let decromaCacheBytes = 0;

/** 按字节预算写入抠绿缓存（FIFO，Map 天然有序）。 */
export function decromaCachePut(url: string, dataUrl: string): void {
    if (DECROMA_CACHE.has(url)) return;
    if (EVICTED_DECROMA.delete(url)) CHURN.decromaReAdds++;
    DECROMA_CACHE.set(url, dataUrl);
    decromaCacheBytes += dataUrl.length * 2;
    while (decromaCacheBytes > DECROMA_CACHE_MAX_BYTES && DECROMA_CACHE.size > 1) {
        const oldest = DECROMA_CACHE.keys().next().value;
        if (oldest === undefined) break;
        const victim = DECROMA_CACHE.get(oldest);
        DECROMA_CACHE.delete(oldest);
        if (victim) decromaCacheBytes -= victim.length * 2;
        CHURN.decromaEvicts++;
        rememberEvicted(EVICTED_DECROMA, oldest);
    }
}

/**
 * 🔴 [2026-08-26 主人「战略进入战斗的时候会卡一下」] 抠绿后**已解码的 Image 对象**缓存。
 *
 *    存 Image 对象后，第二次遇到同一张图：HTTP、抠绿、两次解码**全跳过**，
 *    直接进 SpriteTinter（它自己也有 static 缓存，key 含势力色）。
 *    上限 CLEAN_CACHE_MAX_BYTES 字节，超了淘汰最久未用的（命中会提到队尾 = LRU）。
 */
export const CLEAN_CACHE = new Map<string, HTMLImageElement>();
export const CLEAN_CACHE_MAX_BYTES = 700 * 1024 * 1024;
let cleanCacheBytes = 0;

/**
 * 同一源图的**在途加载**去重表（url → 抠绿图 Promise）。
 */
export const CLEAN_INFLIGHT = new Map<string, Promise<HTMLImageElement | null>>();
export const CLEAN_LOADING = new Map<string, HTMLImageElement>();

/**
 * 取「抠绿后的干净图」：缓存命中直接返回，在途则搭同一班车，否则发起唯一一次加载。
 * 失败一律 resolve(null)（绝不 reject 到调用方漏减 pending），由调用方回退空帧。
 */
export function ensureCleanImage(
    url: string,
    /**
     * 抠绿函数；传 null = **这张图不需要抠绿，原图直接用**。
     */
    dechroma: ((img: HTMLImageElement) => Promise<string>) | null,
    critical = false,
): Promise<HTMLImageElement | null> {
    const hit = CLEAN_CACHE.get(url);
    if (hit && hit.complete && hit.naturalWidth > 0) {
        // 🔴 [2026-09-18] 命中提到队尾 = LRU；不提就是 FIFO，工作集比预算大时会被整批饿死。
        CLEAN_CACHE.delete(url);
        CLEAN_CACHE.set(url, hit);
        return Promise.resolve(hit);
    }
    const flying = CLEAN_INFLIGHT.get(url);
    if (flying) {
        if (critical) { const image = CLEAN_LOADING.get(url); if (image) image.fetchPriority = 'high'; }
        return flying;
    }
    const job = new Promise<HTMLImageElement | null>((resolve) => {
        const toClean = (dataUrl: string) => {
            const clean = new Image();
            // [2026-08-15 玩家色遮罩] 抠绿后 src 变 data: URL，保留源路径供 SpriteTinter 推导 `.pc.png`。
            (clean as any).sourceUrl = url;
            clean.onload = () => { cleanCachePut(url, clean); resolve(clean); };
            clean.onerror = () => resolve(null);
            clean.src = dataUrl;
        };
        const im = new Image();
        im.fetchPriority = critical ? 'high' : 'low';
        CLEAN_LOADING.set(url, im);
        im.onload = () => {
            try {
                // 不需要抠绿（DE 透明素材）：原图即干净图，省掉 Worker 往返 + PNG 重编码 + 第二次解码。
                if (!dechroma) {
                    (im as unknown as { sourceUrl: string }).sourceUrl = url;
                    cleanCachePut(url, im);
                    resolve(im);
                    return;
                }
                const cached = DECROMA_CACHE.get(url);
                if (cached) { toClean(cached); return; }
                void dechroma(im).then((dataUrl) => {
                    if (!dataUrl) { resolve(null); return; }
                    decromaCachePut(url, dataUrl);
                    toClean(dataUrl);
                }).catch(() => resolve(null));
            } catch { resolve(null); }
        };
        im.onerror = () => resolve(null);
        im.src = url;
    }).finally(() => { CLEAN_INFLIGHT.delete(url); CLEAN_LOADING.delete(url); });
    CLEAN_INFLIGHT.set(url, job);
    return job;
}

/** 按字节预算写入抠绿图缓存（LRU：命中处 delete+set 提尾，见上）。图已 onload，尺寸可靠，无需补记。 */
export function cleanCachePut(url: string, img: HTMLImageElement): void {
    if (CLEAN_CACHE.has(url)) return;
    if (EVICTED_CLEAN.delete(url)) CHURN.cleanReAdds++;
    const bytesOf = (im: HTMLImageElement) =>
        (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4 + (im.src?.startsWith('data:') ? im.src.length * 2 : 0);
    CLEAN_CACHE.set(url, img);
    cleanCacheBytes += bytesOf(img);
    while (cleanCacheBytes > CLEAN_CACHE_MAX_BYTES && CLEAN_CACHE.size > 1) {
        const oldest = CLEAN_CACHE.keys().next().value;
        if (oldest === undefined) break;
        const victim = CLEAN_CACHE.get(oldest);
        CLEAN_CACHE.delete(oldest);
        if (victim) cleanCacheBytes -= bytesOf(victim);
        CHURN.cleanEvicts++;
        rememberEvicted(EVICTED_CLEAN, oldest);
    }
}

// [2026-08-31] 把这两个缓存登记进 PerfDoctor 体检（见 src/debug/PerfDoctor.ts）。
if (import.meta.env.DEV) {
    const bytesOfImg = (im: HTMLImageElement) =>
        (im.naturalWidth || 0) * (im.naturalHeight || 0) * 4
        + (im.src?.startsWith('data:') ? im.src.length * 2 : 0);
    perfDoctor.registerCache({
        name: 'Scene13WarLayer:CLEAN_CACHE(抠绿图)',
        where: 'src/ui/scene13/Scene13SpriteCache.ts:CLEAN_CACHE',
        entries: () => CLEAN_CACHE.size,
        bytes: () => { let b = 0; for (const im of CLEAN_CACHE.values()) b += bytesOfImg(im); return b; },
        limitKind: 'bytes',
        limitValue: CLEAN_CACHE_MAX_BYTES,
        churn: () => ({ evicts: CHURN.cleanEvicts, reAdds: CHURN.cleanReAdds }),
    });
    perfDoctor.registerCache({
        name: 'Scene13WarLayer:DECROMA_CACHE(抠绿dataURL)',
        where: 'src/ui/scene13/Scene13SpriteCache.ts:DECROMA_CACHE',
        entries: () => DECROMA_CACHE.size,
        bytes: () => { let b = 0; for (const v of DECROMA_CACHE.values()) b += v.length * 2; return b; },
        limitKind: 'bytes',
        limitValue: DECROMA_CACHE_MAX_BYTES,
        churn: () => ({ evicts: CHURN.decromaEvicts, reAdds: CHURN.decromaReAdds }),
    });
}

// ── 火枪弹白烟弹线预渲染 sprite（颜色固定、跨战斗复用）──
let GUNPOWDER_TRAIL_SPRITE: HTMLCanvasElement | null = null;
export function gunpowderTrailSprite(): HTMLCanvasElement {
    if (!GUNPOWDER_TRAIL_SPRITE) {
        const c = document.createElement('canvas');
        c.width = 90; c.height = 4;
        const g = c.getContext('2d')!;
        const grad = g.createLinearGradient(0, 0, 90, 0);
        grad.addColorStop(0, 'rgba(230, 235, 245, 0)');
        grad.addColorStop(0.55, 'rgba(240, 245, 255, 0.45)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
        g.lineWidth = 2.4;
        g.strokeStyle = grad;
        g.lineCap = 'round';
        g.beginPath();
        g.moveTo(0, 2);
        g.lineTo(90, 2);
        g.stroke();
        GUNPOWDER_TRAIL_SPRITE = c;
    }
    return GUNPOWDER_TRAIL_SPRITE;
}
