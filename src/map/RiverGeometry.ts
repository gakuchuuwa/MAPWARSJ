type RiverPoint = [number, number];

/** Render-only rounding. Endpoints stay fixed so tributaries and lake mouths still meet. */
export function smoothRiverLine(coords: RiverPoint[]): RiverPoint[] {
    if (coords.length <= 2) return coords;
    const result: RiverPoint[] = [coords[0]];
    const pixelsPerDegree = 256 * 2 ** 9 / 360;
    for (let i = 1; i < coords.length - 1; i++) {
        const previous = coords[i - 1], point = coords[i], next = coords[i + 1];
        const yScale = 1 / Math.cos(Math.min(85, Math.abs(point[1])) * Math.PI / 180);
        const ax = previous[0] - point[0], ay = previous[1] - point[1];
        const bx = next[0] - point[0], by = next[1] - point[1];
        const before = Math.hypot(ax, ay * yScale) * pixelsPerDegree;
        const after = Math.hypot(bx, by * yScale) * pixelsPerDegree;
        if (before < 0.001 || after < 0.001) {
            result.push(point);
            continue;
        }
        // Round only near the corner: never cut more than a quarter of either segment
        // or eight pixels at zoom 9. Long straight reaches keep their source alignment.
        const entry = Math.min(0.25, 8 / before);
        const exit = Math.min(0.25, 8 / after);
        const start: RiverPoint = [point[0] + ax * entry, point[1] + ay * entry];
        const end: RiverPoint = [point[0] + bx * exit, point[1] + by * exit];
        const curvature = Math.hypot(
            start[0] - 2 * point[0] + end[0],
            (start[1] - 2 * point[1] + end[1]) * yScale,
        ) * pixelsPerDegree;
        // Quadratic chord error <= curvature / (4 * steps^2); add detail only
        // where the bend needs it, instead of doubling every vertex globally.
        if (curvature < 0.18) {
            result.push(point);
            continue;
        }
        const steps = Math.min(8, Math.max(2, Math.ceil(Math.sqrt(curvature / 0.72))));
        result.push(start);
        for (let j = 1; j <= steps; j++) {
            const t = j / steps, u = 1 - t;
            result.push([
                u * u * start[0] + 2 * u * t * point[0] + t * t * end[0],
                u * u * start[1] + 2 * u * t * point[1] + t * t * end[1],
            ]);
        }
    }
    result.push(coords[coords.length - 1]);
    return result;
}
