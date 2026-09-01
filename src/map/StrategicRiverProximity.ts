interface RiverFeatureIndex {
    bbox: [number, number, number, number];
    lines: ReadonlyArray<ReadonlyArray<readonly [number, number]>>;
}

let riverIndex: RiverFeatureIndex[] = [];

function collectLines(coords: unknown, out: Array<Array<readonly [number, number]>>): void {
    if (!Array.isArray(coords) || coords.length === 0) return;
    if (typeof coords[0]?.[0] === 'number') {
        const line = (coords as unknown[])
            .filter((p): p is [number, number] => Array.isArray(p) && typeof p[0] === 'number' && typeof p[1] === 'number')
            .map((p) => [p[0], p[1]] as const);
        if (line.length >= 2) out.push(line);
        return;
    }
    for (const child of coords) collectLines(child, out);
}

/** 缓存战略地图正在使用的 Natural Earth 河流中心线，仅建立只读邻近索引。 */
export function setStrategicRiverProximityData(geojson: any): void {
    const next: RiverFeatureIndex[] = [];
    for (const feature of geojson?.features ?? []) {
        if (feature?.properties?.featurecla === 'Lake Centerline') continue;
        const lines: Array<Array<readonly [number, number]>> = [];
        collectLines(feature?.geometry?.coordinates, lines);
        if (lines.length === 0) continue;
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        for (const line of lines) for (const [lng, lat] of line) {
            if (lng < minLng) minLng = lng;
            if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }
        next.push({ bbox: [minLng, minLat, maxLng, maxLat], lines });
    }
    riverIndex = next;
}

function pointSegmentDistanceKm(
    lat: number,
    lng: number,
    a: readonly [number, number],
    b: readonly [number, number],
): number {
    const cosLat = Math.max(0.01, Math.cos(lat * Math.PI / 180));
    const ax = (a[0] - lng) * cosLat * 111.32;
    const ay = (a[1] - lat) * 111.32;
    const bx = (b[0] - lng) * cosLat * 111.32;
    const by = (b[1] - lat) * 111.32;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    return Math.hypot(ax + dx * t, ay + dy * t);
}

/** 战略地图的矢量河流中心线是否位于据点指定公里数内。 */
export function isNearStrategicRiver(lat: number, lng: number, maxDistanceKm = 25): boolean {
    if (riverIndex.length === 0) return false;
    const latPad = maxDistanceKm / 111.32;
    const lngPad = latPad / Math.max(0.01, Math.cos(lat * Math.PI / 180));
    for (const entry of riverIndex) {
        const [minLng, minLat, maxLng, maxLat] = entry.bbox;
        if (maxLng < lng - lngPad || minLng > lng + lngPad || maxLat < lat - latPad || minLat > lat + latPad) continue;
        for (const line of entry.lines) {
            for (let i = 1; i < line.length; i++) {
                if (pointSegmentDistanceKm(lat, lng, line[i - 1], line[i]) <= maxDistanceKm) return true;
            }
        }
    }
    return false;
}
