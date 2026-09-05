import { latLngToTile } from '../../map/TileMapConfig';
import { latLngToTilePixel } from './ElevationSampler';
import { DEM_ZOOM, TERRARIUM_TILE_SIZE } from './TerrariumCodec';
import { ESRI_SHADED_RELIEF_URL, buildWaterMask, isDefectGrayTile } from './WaterMask';
import { decodeTileRGBA } from './TileDecoder';

/** 瓦片取回失败后的重试冷却（真实毫秒）：期间不再重发请求，网络恢复后仍能重试 */
const TILE_RETRY_COOLDOWN_MS = 60_000;
/** 负缓存/警告去重表的上限，超了整表清空（宁可多试一次，也不让 Map 无限涨） */
const TILE_FAIL_CACHE_MAX = 4096;


/** 取图超时 (ms)：拿不到就回退海拔判据，不能让判定悬着 */
const TILE_TIMEOUT_MS = 8000;

type TileLoadedListener = () => void;

function tileCacheKey(zoom: number, x: number, y: number): string {
    return `${zoom}/${x}/${y}`;
}

/**
 * 拉 ESRI 晕渲瓦片并按像素查「是不是水」；瓦片 LRU 缓存供同步查询。
 *
 * 结构刻意与 ElevationSampler 保持一致（同样的瓦片编号、同样的 LRU、同样的
 * scheduleFetch / prefetchBounds 语义），这样 LandSeaSystem 两边可以并排使用。
 * 判水依据见 WaterMask.ts。
 */
export class WaterMaskSampler {
    /**
     * 值为 null = 该瓦片不可用（ESRI 缓存烤坏的纯灰块）。
     * 仍然入缓存是刻意的：否则每次查询都会重新发起拉取，把坏瓦片反复拉个不停。
     * 查到 null 时 isWaterSync 返回 null，调用方回退到海拔判据。
     */
    private readonly cache = new Map<string, Uint8Array | null>();
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

    hasTile(zoom: number, x: number, y: number): boolean {
        return this.cache.has(tileCacheKey(zoom, x, y));
    }

    /**
     * 同步查询「该点是不是水」。
     * 瓦片未缓存时返回 null（调用方据此回退到海拔判据）并触发后台拉取。
     */
    isWaterSync(lat: number, lng: number, zoom = DEM_ZOOM): boolean | null {
        const { tileX, tileY, pixelX, pixelY } = latLngToTilePixel(lat, lng, zoom);
        const key = tileCacheKey(zoom, tileX, tileY);
        if (!this.cache.has(key)) {
            void this.ensureTile(zoom, tileX, tileY);
            return null;
        }
        const mask = this.cache.get(key);
        this.touchCache(key);
        // 已缓存但为 null = 坏瓦片，判定不可用 → 让调用方回退海拔
        if (!mask) return null;
        return mask[pixelY * TERRARIUM_TILE_SIZE + pixelX] === 1;
    }

    /**
     * 整块掩膜（批量采样用）：调用方自己按像素索引取值，避免逐点走 isWaterSync
     * ——那条路每次都要 touchCache 做 O(缓存条数) 的线性扫描。
     *
     * 返回 undefined = 瓦片未缓存；{ mask: null } = 已知的坏瓦片（纯灰块，判定不可用）。
     */
    getTileMaskSync(zoom: number, x: number, y: number): { mask: Uint8Array | null } | undefined {
        const key = tileCacheKey(zoom, x, y);
        if (!this.cache.has(key)) return undefined;
        this.touchCache(key);
        return { mask: this.cache.get(key) ?? null };
    }

    scheduleFetch(lat: number, lng: number, zoom = DEM_ZOOM): void {
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
            // 注意 ESRI 的路径顺序是 {z}/{y}/{x}，y 在前——与 Terrarium 相反，别写反
            const url = ESRI_SHADED_RELIEF_URL.replace('{z}', String(zoom))
                .replace('{y}', String(y))
                .replace('{x}', String(x));

            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
                const el = new Image();
                el.crossOrigin = 'Anonymous';
                const timer = setTimeout(() => {
                    el.src = '';   // 中断加载，释放连接
                    reject(new Error(`ESRI tile timeout: ${url}`));
                }, TILE_TIMEOUT_MS);
                el.onload = () => { clearTimeout(timer); resolve(el); };
                el.onerror = () => { clearTimeout(timer); reject(new Error(`ESRI tile failed: ${url}`)); };
                el.src = url;
            });

            // ESRI 瓦片原生 256px，与 TERRARIUM_TILE_SIZE 一致；万一尺寸不符 decodeTileRGBA 会缩放到同一网格。
            // [2026-09-05] 画布改共享复用（原来逐瓦片新建）；willReadFrequently 本来就有，保持。
            const rgba = decodeTileRGBA(img, TERRARIUM_TILE_SIZE);
            if (!rgba) return false;
            // 坏瓦片（整块纯灰）会被误读成「整块都是陆地」，会让海面变成可行军的陆地。
            // 存 null 占位：既标记为不可用，又避免每次查询都重新拉取。
            this.cache.set(
                key,
                isDefectGrayTile(rgba, TERRARIUM_TILE_SIZE, TERRARIUM_TILE_SIZE)
                    ? null
                    : buildWaterMask(rgba, TERRARIUM_TILE_SIZE * TERRARIUM_TILE_SIZE),
            );
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
                console.warn('[WaterMaskSampler]', err);
            }
            return false;
        } finally {
            this.pending.delete(key);
        }
    }

    /** 预取视口内瓦片（不阻塞） */
    prefetchBounds(
        north: number,
        south: number,
        west: number,
        east: number,
        zoom = DEM_ZOOM,
        padding = 1
    ): void {
        const nw = latLngToTile(north, west, zoom);
        const se = latLngToTile(south, east, zoom);
        const xMin = Math.min(nw.x, se.x) - padding;
        const xMax = Math.max(nw.x, se.x) + padding;
        const yMin = Math.min(nw.y, se.y) - padding;
        const yMax = Math.max(nw.y, se.y) + padding;
        const maxTile = Math.pow(2, zoom);

        for (let ty = yMin; ty <= yMax; ty++) {
            for (let tx = xMin; tx <= xMax; tx++) {
                if (tx < 0 || ty < 0 || tx >= maxTile || ty >= maxTile) continue;
                void this.ensureTile(zoom, tx, ty);
            }
        }
    }
}
