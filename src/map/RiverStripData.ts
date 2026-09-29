/**
 * 沙漠中的河流绿带 · 河流线段数据（主线程与晕渲 Worker 共用同一份口径）。
 *
 * 🔴 [2026-09-30 主人令] 两河流域、印度河、尼罗河、阿姆河……古代最重要的灌溉农业带，气候分区图每格约 18km，
 *    十几到几十公里宽的河谷塞不进一格，原来整片按周围沙漠上色（巴比伦、帕塔拉像沙丘）。
 *    数据：战略地图同一份 Natural Earth 河流中心线（public/assets/ne_10m_rivers_lake_centerlines.geojson）。
 *    主线程本来就要加载解析它（画河流），在那里抽稀一次、发给各 Worker —— 旧做法每个 Worker 各自下载解析 6MB，
 *    实测首块瓦片慢 0.6 秒（scratch/terrain_ab/bench_firstscreen.mjs）。
 */

/** 绿带半宽（公里），按 Natural Earth scalerank；取 7 级及以上（阿姆河/锡尔河 5 级，赫尔曼德河/奇纳布河 6 级；
 *  7 级不能省：巴比伦城边的幼发拉底河希拉河道、尼罗河三角洲西支都是 7 级） */
export const RIVER_HALF_WIDTH_KM: Readonly<Record<number, number>> = { 0: 9, 1: 9, 2: 10, 3: 13, 4: 12, 5: 10, 6: 6, 7: 5 };

/**
 * GeoJSON → 线段数组 [lng1, lat1, lng2, lat2, 半宽km] × N。
 * 沿河每 ~4km 保留一个点：弦与弯曲河道偏差 <0.5km，相对 5~13km 半宽、边缘渐隐的绿带可忽略；
 * 原始 17 万段时单块瓦片距离场要 94~177ms，抽稀后约 7 万段（scratch/terrain_ab/river_cost2.mts）。
 */
export function buildRiverSegments(geojson: any): Float32Array {
    const segs: number[] = [];
    const walk = (c: unknown, w: number) => {
        if (!Array.isArray(c) || c.length === 0) return;
        if (typeof c[0]?.[0] === 'number') {
            let lx = c[0][0], ly = c[0][1];
            for (let i = 1; i < c.length; i++) {
                const x = c[i][0], y = c[i][1];
                if (i < c.length - 1 && Math.abs(x - lx) + Math.abs(y - ly) < 0.045) continue;
                segs.push(lx, ly, x, y, w);
                lx = x; ly = y;
            }
            return;
        }
        for (const child of c) walk(child, w);
    };
    for (const f of geojson?.features ?? []) {
        if (f?.properties?.featurecla !== 'River') continue;
        const w = RIVER_HALF_WIDTH_KM[f.properties.scalerank as number];
        if (w) walk(f.geometry?.coordinates, w);
    }
    return new Float32Array(segs);
}

/** 主线程 → Worker 的消息 */
export interface RiverSegmentsMessage {
    type: 'rivers';
    /** null = 主线程河流数据加载失败，Worker 不再等待 */
    segs: Float32Array | null;
}
