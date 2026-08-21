/** 将经度归一化到 [-180, 180)。 */
export function normalizeLongitude(lng: number): number {
    if (!Number.isFinite(lng)) return lng;
    return ((lng + 180) % 360 + 360) % 360 - 180;
}

/** 从 from 到 to 的最短有符号经度差，范围 [-180, 180)。 */
export function shortestLongitudeDelta(from: number, to: number): number {
    return normalizeLongitude(to - from);
}

/** 将 lng 展开到离 reference 最近的世界副本，用于跨日期变更线的连续折线。 */
export function unwrapLongitudeNear(lng: number, reference: number): number {
    return reference + shortestLongitudeDelta(reference, lng);
}

/** 沿最短经度方向插值；结果保持连续，可暂时超出 [-180, 180)。 */
export function interpolateLongitudeShortest(from: number, to: number, t: number): number {
    return from + shortestLongitudeDelta(from, to) * t;
}

/** 将 GeoJSON [lng, lat] 折线展开成跨日期变更线仍连续的坐标序列。 */
export function unwrapLongitudePath(coords: readonly [number, number][]): [number, number][] {
    if (coords.length === 0) return [];
    const out: [number, number][] = [[normalizeLongitude(coords[0][0]), coords[0][1]]];
    for (let i = 1; i < coords.length; i++) {
        const prevLng = out[i - 1][0];
        out.push([unwrapLongitudeNear(coords[i][0], prevLng), coords[i][1]]);
    }
    return out;
}
