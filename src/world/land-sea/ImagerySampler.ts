import { latLngToTilePixel } from './ElevationSampler';

/** 瓦片取回失败后的重试冷却（真实毫秒）：期间不再重发请求，网络恢复后仍能重试 */
const TILE_RETRY_COOLDOWN_MS = 60_000;
/** 负缓存/警告去重表的上限，超了整表清空（宁可多试一次，也不让 Map 无限涨） */
const TILE_FAIL_CACHE_MAX = 4096;


/**
 * ESRI World Imagery（卫星影像）采样器 —— 读战场那块地真实长什么样，判 biome 用。
 *
 * 结构照抄 ElevationSampler（同瓦片编号、同 LRU、同同步查询/后台拉取语义），
 * 只把瓦片源从 Terrarium 高程换成 ESRI 卫星照片。13 铁律：绝不阻塞加载——
 * 瓦片未缓存就返回 null 并 scheduleFetch 预取下局命中。
 */
const IMAGERY_TILE_URL =
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

/** 采样 zoom：一块瓦片覆盖战场足够（z10 一瓦片 ≈ 39km） */
const IMAGERY_ZOOM = 10;

const IMAGERY_TILE_SIZE = 256;

/** 战场中心 32×32 中位色采样的半宽（32×32 → half=16） */
const TONE_SAMPLE_HALF = 16;

export type ImageryTone = 'green' | 'yellow' | 'white' | 'gray' | 'blue';

function tileCacheKey(zoom: number, x: number, y: number): string {
    return `${zoom}/${x}/${y}`;
}

type TileLoadedListener = () => void;

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const d = max - min;
    let h = 0;
    if (d > 0) {
        if (max === rn) h = ((gn - bn) / d) % 6;
        else if (max === gn) h = (bn - rn) / d + 2;
        else h = (rn - gn) / d + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    const s = max === 0 ? 0 : d / max;
    return { h, s, v: max };
}

export class ImagerySampler {
    private static instance: ImagerySampler | null = null;

    static getInstance(): ImagerySampler {
        if (!ImagerySampler.instance) ImagerySampler.instance = new ImagerySampler();
        return ImagerySampler.instance;
    }

    private readonly cache = new Map<string, Uint8ClampedArray>();
    private readonly cacheOrder: string[] = [];
    private readonly pending = new Set<string>();
    /**
     * 🔴 [2026-09-02 主人「周围没据点反而卡，尤其海上/咸海/撒哈拉」] 取瓦片**失败**的负缓存。
     * 改前：ensureTile 失败只 console.warn + return false，`finally` 把 key 从 pending 删掉，
     * 既不入 cache 也不记失败 —— 于是下一次 scheduleFetch 又是全新的一次 new Image() 请求。
     * 而 Army.update **每帧**都调 scheduleFetch（还有 isSeaAt 在 elev===null 时也调），
     * 所以只要瓦片源在那一带没有数据（大洋 / 咸海 / 撒哈拉这类 404 或空覆盖区），
     * 就变成「每帧发一次注定失败的请求 + 每帧一条 console.warn」，一顿一顿的就是这么来的。
     * 反过来，据点和军团多的地方是陆地核心区、瓦片齐全，命中缓存反而不卡 —— 与主人观察一致。
     * 失败后冷却 TILE_RETRY_COOLDOWN_MS 才允许重试（网络抖动仍能恢复，不会永久放弃）。
     */
    private readonly failedAt = new Map<string, number>();
    /** 已经警告过的 key：同一块瓦片只吼一次，别刷屏（console.warn 本身在热路径上也不便宜） */
    private readonly warnedKeys = new Set<string>();
    private readonly maxCacheTiles: number;
    private tileLoadedListeners = new Set<TileLoadedListener>();

    constructor(maxCacheTiles = 320) {
        this.maxCacheTiles = maxCacheTiles;
    }

    onTileLoaded(listener: TileLoadedListener): () => void {
        this.tileLoadedListeners.add(listener);
        return () => this.tileLoadedListeners.delete(listener);
    }

    private notifyTileLoaded(): void {
        for (const listener of this.tileLoadedListeners) listener();
    }

    private touchCache(key: string): void {
        const idx = this.cacheOrder.indexOf(key);
        if (idx >= 0) this.cacheOrder.splice(idx, 1);
        this.cacheOrder.push(key);
    }

    private evictIfNeeded(): void {
        while (this.cache.size > this.maxCacheTiles && this.cacheOrder.length > 0) {
            const oldest = this.cacheOrder.shift()!;
            this.cache.delete(oldest);
        }
    }

    private getTileDataSync(zoom: number, tileX: number, tileY: number): Uint8ClampedArray | null {
        const key = tileCacheKey(zoom, tileX, tileY);
        const data = this.cache.get(key);
        if (data) this.touchCache(key);
        return data ?? null;
    }

    /**
     * 同步取战场中心 32×32 像素的中位色 → 判色调。
     * 瓦片未缓存时返回 null 并触发后台拉取（下一局命中）。
     */
    getToneSync(lat: number, lng: number, zoom = IMAGERY_ZOOM): ImageryTone | null {
        const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng, zoom);
        const data = this.getTileDataSync(zoom, tileX, tileY);
        if (!data) {
            void this.ensureTile(zoom, tileX, tileY);
            return null;
        }

        const S = IMAGERY_TILE_SIZE;
        const half = TONE_SAMPLE_HALF;
        const rs: number[] = [];
        const gs: number[] = [];
        const bs: number[] = [];
        for (let dy = -half; dy < half; dy++) {
            for (let dx = -half; dx < half; dx++) {
                const px = Math.min(S - 1, Math.max(0, pixelX + dx));
                const py = Math.min(S - 1, Math.max(0, pixelY + dy));
                const i = (py * S + px) * 4;
                rs.push(data[i]);
                gs.push(data[i + 1]);
                bs.push(data[i + 2]);
            }
        }
        rs.sort((a, b) => a - b);
        gs.sort((a, b) => a - b);
        bs.sort((a, b) => a - b);
        const mid = rs.length >> 1;
        const { h, s, v } = rgbToHsv(rs[mid], gs[mid], bs[mid]);

        // 判据照抄工单 §1.1，顺序即优先级
        if (v > 0.8 && s < 0.15) return 'white';            // 雪/冰
        if (s < 0.12 && v >= 0.3 && v <= 0.7) return 'gray'; // 裸岩/砾石
        if (h >= 60 && h < 160 && s > 0.25) return 'green';  // 植被
        if (h >= 20 && h < 60) return 'yellow';              // 干旱/枯黄
        if (h >= 160 && h <= 260 && s > 0.2) return 'blue';  // 水体
        return null; // 未命中任何一类（深绿针叶 S 低、暗部 V 低等）→ 让 biome 判定走兜底
    }

    scheduleFetch(lat: number, lng: number, zoom = IMAGERY_ZOOM): void {
        const { tileX, tileY } = latLngToTilePixel(lat, lng, zoom);
        void this.ensureTile(zoom, tileX, tileY);
    }

    async ensureTile(zoom: number, x: number, y: number): Promise<boolean> {
        const key = tileCacheKey(zoom, x, y);
        if (this.cache.has(key)) return true;
        if (this.pending.has(key)) return false;
        // 负缓存：上次失败还在冷却期内 → 直接放弃，不再发请求（见 failedAt 注释）
        const failedTs = this.failedAt.get(key);
        if (failedTs !== undefined && Date.now() - failedTs < TILE_RETRY_COOLDOWN_MS) return false;

        this.pending.add(key);
        try {
            // 注意 ESRI 路径顺序是 {z}/{y}/{x}，y 在前——与 Terrarium 相反
            const url = IMAGERY_TILE_URL.replace('{z}', String(zoom))
                .replace('{y}', String(y))
                .replace('{x}', String(x));

            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.crossOrigin = 'Anonymous';
                el.onload = () => resolve(el);
                el.onerror = () => reject(new Error(`Imagery tile failed: ${url}`));
                el.src = url;
            });

            const canvas = document.createElement('canvas');
            canvas.width = IMAGERY_TILE_SIZE;
            canvas.height = IMAGERY_TILE_SIZE;
            const ctx = canvas.getContext('2d');
            if (!ctx) return false;

            ctx.drawImage(img, 0, 0, IMAGERY_TILE_SIZE, IMAGERY_TILE_SIZE);
            const imageData = ctx.getImageData(0, 0, IMAGERY_TILE_SIZE, IMAGERY_TILE_SIZE);
            this.cache.set(key, imageData.data);
            this.touchCache(key);
            this.evictIfNeeded();
            this.failedAt.delete(key);
            this.notifyTileLoaded();
            return true;
        } catch (err) {
            // 记负缓存 + 只警告一次：这块瓦片在冷却期内不再重试，避免每帧重发（见 failedAt 注释）
            this.failedAt.set(key, Date.now());
            if (this.failedAt.size > TILE_FAIL_CACHE_MAX) this.failedAt.clear();
            if (!this.warnedKeys.has(key)) {
                this.warnedKeys.add(key);
                if (this.warnedKeys.size > TILE_FAIL_CACHE_MAX) this.warnedKeys.clear();
                console.warn('[ImagerySampler]', err);
            }
            return false;
        } finally {
            this.pending.delete(key);
        }
    }
}
