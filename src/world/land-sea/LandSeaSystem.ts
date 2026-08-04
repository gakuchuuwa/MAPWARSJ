import type L from 'leaflet';
import type { LatLng } from '../../types/core';
import { ElevationSampler, latLngToTilePixel } from './ElevationSampler';
import {
    DEM_ZOOM,
    TERRARIUM_TILE_SIZE,
    decodeTerrariumElevation,
    isSeaElevation,
} from './TerrariumCodec';
import { WaterMaskSampler } from './WaterMaskSampler';

type LandSeaKind = 'land' | 'sea';

/**
 * 陆海判定：以 ESRI 底图的水域掩膜为准（即画海岸线描边用的那份数据）。
 *
 * [2026-07-28] 原判据是「Terrarium DEM 海拔 < 0 = 海」，遇到低于海平面的陆地必错：
 * 里海低地（伊蒂尔 -27m）、吐鲁番盆地（高昌 -51m）都被判成海，骑兵在那里显示成船。
 * 里海区域 12000 点抽样，旧判据正确率仅 71.0%。原因见 WaterMask.ts。
 *
 * 海拔判据保留为**兜底**：掩膜瓦片尚未到达时沿用旧行为，避免断网/慢网时全图变陆地。
 */
export class LandSeaSystem {
    private static sampler = new ElevationSampler();
    private static waterSampler = new WaterMaskSampler();
    private static resultCache = new Map<string, boolean>();
    private static readonly maxResultCache = 8000;
    private static mapBound = false;

    static getSampler(): ElevationSampler {
        return this.sampler;
    }

    static getWaterSampler(): WaterMaskSampler {
        return this.waterSampler;
    }

    static initialize(): void {
        if (this.mapBound) return;
        const onTiles = () => {
            this.resultCache.clear();
            window.dispatchEvent(new CustomEvent('land-sea-tiles-updated'));
        };
        this.sampler.onTileLoaded(onTiles);
        // 掩膜瓦片到达后同样要清缓存：此前用海拔兜底算出的结果需要被订正
        this.waterSampler.onTileLoaded(onTiles);
        this.mapBound = true;
    }

    static bindLeafletMap(map: L.Map): void {
        this.initialize();
        const prefetch = () => {
            const b = map.getBounds();
            this.sampler.prefetchBounds(b.getNorth(), b.getSouth(), b.getWest(), b.getEast());
            this.waterSampler.prefetchBounds(b.getNorth(), b.getSouth(), b.getWest(), b.getEast());
        };
        map.on('moveend', prefetch);
        map.on('zoomend', prefetch);
        prefetch();
    }

    static prefetchViewport(map: L.Map): void {
        const b = map.getBounds();
        this.sampler.prefetchBounds(b.getNorth(), b.getSouth(), b.getWest(), b.getEast());
        this.waterSampler.prefetchBounds(b.getNorth(), b.getSouth(), b.getWest(), b.getEast());
    }

    private static cacheKey(lat: number, lng: number): string {
        const { tileX, tileY, pixelX, pixelY, zoom } = latLngToTilePixel(lat, lng);
        return `${zoom}/${tileX}/${tileY}:${pixelX},${pixelY}`;
    }

    private static rememberResult(key: string, isSea: boolean): boolean {
        if (this.resultCache.size >= this.maxResultCache) {
            this.resultCache.clear();
        }
        this.resultCache.set(key, isSea);
        return isSea;
    }

    /** 同步查询；瓦片未到时返回 false（陆）并后台拉瓦片，下一帧再判 */
    static isSeaAt(latLng: LatLng): boolean {
        const key = this.cacheKey(latLng.lat, latLng.lng);
        const cached = this.resultCache.get(key);
        if (cached !== undefined) return cached;

        // 「海」= 掩膜说是水 **且** 海拔低于 0，两个条件缺一不可。
        //
        // [2026-07-28] 单用任何一条都错，两类错误正好互补：
        //   只看海拔 → 低于海平面的「陆地」被判成海
        //              （伊蒂尔 -27m、高昌 -51m，骑兵变船）
        //   只看掩膜 → 海平面以上的「内陆水」被判成海
        //              （两河/湖泊；巴格达周边 6800 点里 234 个点 +28~+100m 被判成海，
        //                沿河行军全变船。这是 2026-07-28 改坏又改回来的真实教训）
        // 取交集后判定域只会比两者都小，因此**不可能新增**误判为海的地方。
        const water = this.waterSampler.isWaterSync(latLng.lat, latLng.lng);

        // 掩膜明确说不是水 → 一定不是海，无需再问海拔，可安全入缓存
        if (water === false) return this.rememberResult(key, false);

        const elev = this.sampler.getElevationSync(latLng.lat, latLng.lng);
        if (elev === null) {
            this.sampler.scheduleFetch(latLng.lat, latLng.lng);
            return false;
        }

        if (water === null) {
            // 掩膜瓦片还没到：暂用海拔判据维持旧行为。
            // 刻意**不写入 resultCache**——否则里海/吐鲁番会被这个错误答案锁死。
            this.waterSampler.scheduleFetch(latLng.lat, latLng.lng);
            return isSeaElevation(elev);
        }

        return this.rememberResult(key, isSeaElevation(elev));
    }

    static isLandAt(latLng: LatLng): boolean {
        return !this.isSeaAt(latLng);
    }

    /**
     * 调试可视化专用：**不读写 resultCache、不触发拉瓦片**的海陆探测。
     *
     * 为什么不能直接用 isSeaAt：分界线图层一屏要采上万点，每点都是不同的缓存键，
     * resultCache 上限 8000 且满了就整表 clear ⇒ 一次重绘能把军团行军正在用的判定结果
     * 冲掉十几遍。此方法只读采样器，判据与 isSeaAt 逐条一致（掩膜 AND 海拔<0）。
     *
     * 返回 'pending' = 高程瓦片还没到，游戏此刻按「陆」处理但其实并不知道；
     * 分界图层据此画灰色，避免主人把「还没加载」误读成「这里是陆地」。
     */
    static probeLandSea(lat: number, lng: number): 'sea' | 'land' | 'pending' {
        const water = this.waterSampler.isWaterSync(lat, lng);
        // 掩膜明确说不是水 → 一定不是海（与 isSeaAt 同）
        if (water === false) return 'land';

        const elev = this.sampler.getElevationSync(lat, lng);
        // 高程未到：isSeaAt 此时返回 false(陆)，但那是「不知道」而非「是陆」
        if (elev === null) return 'pending';

        // water === null（掩膜未到）时 isSeaAt 回退纯海拔判据，这里如实反映同一答案
        return isSeaElevation(elev) ? 'sea' : 'land';
    }

    static getLandSeaKind(latLng: LatLng): LandSeaKind {
        return this.isSeaAt(latLng) ? 'sea' : 'land';
    }

    /**
     * 调试图层专用的**批量**探测器：入参是 DEM 全局像素坐标（用 lngToDemGlobalX /
     * latToDemGlobalY 按行列预算好），内部只在跨瓦片时才解析一次瓦片数组。
     *
     * 为什么不逐点调 probeLandSea：采样器的 LRU touch 是 O(缓存条数) 的数组线性扫描，
     * 逐点调用时一屏 5.8 万点实测 651ms（1800 万次字符串比较）；按瓦片解析后同一屏
     * 只需几十次瓦片查找。判据与 isSeaAt / probeLandSea 逐条一致。
     *
     * 返回的函数不是线程安全的，也不要跨帧复用——每次重绘新建一个。
     */
    static createBlockProber(
        zoom = DEM_ZOOM,
    ): (globalPxX: number, globalPxY: number) => 'sea' | 'land' | 'pending' {
        const S = TERRARIUM_TILE_SIZE;
        let curTX = Number.NaN;
        let curTY = Number.NaN;
        let elevTile: Uint8ClampedArray | null = null;
        let maskTile: Uint8Array | null = null;
        let maskUsable = false;

        return (globalPxX: number, globalPxY: number) => {
            const tx = Math.floor(globalPxX / S);
            const ty = Math.floor(globalPxY / S);
            if (tx !== curTX || ty !== curTY) {
                curTX = tx;
                curTY = ty;
                elevTile = this.sampler.getTileDataSync(zoom, tx, ty);
                const m = this.waterSampler.getTileMaskSync(zoom, tx, ty);
                maskTile = m?.mask ?? null;
                maskUsable = !!m && m.mask !== null;   // 未缓存或坏瓦片都不可用
            }

            const px = Math.floor(globalPxX) % S;
            const py = Math.floor(globalPxY) % S;
            const idx = py * S + px;

            // 掩膜明确说不是水 → 一定不是海（与 isSeaAt 同）
            if (maskUsable && maskTile![idx] !== 1) return 'land';
            // 高程未到 → 「不知道」，别画成陆地骗人
            if (!elevTile) return 'pending';
            const e = idx * 4;
            const elev = decodeTerrariumElevation(elevTile[e], elevTile[e + 1], elevTile[e + 2]);
            return isSeaElevation(elev) ? 'sea' : 'land';
        };
    }

    static async isSeaAtAsync(latLng: LatLng): Promise<boolean> {
        const { tileX, tileY, pixelX, pixelY, zoom } = latLngToTilePixel(
            latLng.lat,
            latLng.lng
        );
        await this.sampler.ensureTile(zoom, tileX, tileY);
        return this.isSeaAt(latLng);
    }

    /** 海拔（米）；瓦片未到时 null */
    static getElevationSync(lat: number, lng: number): number | null {
        return this.sampler.getElevationSync(lat, lng);
    }

    /**
     * 按 Leaflet 地图像素直接采样海拔（避免逐格 lat/lng 三角运算）。
     * globalX/globalY 为 zoom 级世界像素坐标；瓦片未缓存时 null 并触发后台拉取。
     */
    static getElevationAtMapPixel(
        globalX: number,
        globalY: number,
        zoom = DEM_ZOOM,
        scheduleLat?: number,
        scheduleLng?: number
    ): number | null {
        const tileX = Math.floor(globalX / TERRARIUM_TILE_SIZE);
        const tileY = Math.floor(globalY / TERRARIUM_TILE_SIZE);
        const pixelX = Math.min(
            TERRARIUM_TILE_SIZE - 1,
            Math.max(0, Math.floor(globalX - tileX * TERRARIUM_TILE_SIZE))
        );
        const pixelY = Math.min(
            TERRARIUM_TILE_SIZE - 1,
            Math.max(0, Math.floor(globalY - tileY * TERRARIUM_TILE_SIZE))
        );

        const data = this.sampler.getTileDataSync(zoom, tileX, tileY);
        if (!data) {
            if (scheduleLat !== undefined && scheduleLng !== undefined) {
                this.sampler.scheduleFetch(scheduleLat, scheduleLng, zoom);
            }
            return null;
        }

        const idx = (pixelY * TERRARIUM_TILE_SIZE + pixelX) * 4;
        return decodeTerrariumElevation(data[idx], data[idx + 1], data[idx + 2]);
    }

    /**
     * 批量采样矩形网格海拔；coords 为 [globalX, globalY, lat, lng] 四元组数组。
     * 返回与 coords 等长的海拔数组（瓦片未到时为 null）。
     */
    static sampleElevationBlock(
        coords: ReadonlyArray<{ globalX: number; globalY: number; lat: number; lng: number }>,
        zoom = DEM_ZOOM
    ): (number | null)[] {
        const out: (number | null)[] = new Array(coords.length);
        for (let i = 0; i < coords.length; i++) {
            const c = coords[i];
            out[i] = this.getElevationAtMapPixel(c.globalX, c.globalY, zoom, c.lat, c.lng);
        }
        return out;
    }
}
