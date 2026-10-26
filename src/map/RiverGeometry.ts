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
        // Round only near the corner: never cut more than a third of either segment
        // or eighteen pixels at zoom 9 (2026-10-26 主人令「河流更圆滑」：原 0.25 / 8px)。
        // Long straight reaches keep their source alignment.
        const entry = Math.min(0.42, 18 / before);
        const exit = Math.min(0.42, 18 / after);
        const start: RiverPoint = [point[0] + ax * entry, point[1] + ay * entry];
        const end: RiverPoint = [point[0] + bx * exit, point[1] + by * exit];
        const curvature = Math.hypot(
            start[0] - 2 * point[0] + end[0],
            (start[1] - 2 * point[1] + end[1]) * yScale,
        ) * pixelsPerDegree;
        // Quadratic chord error <= curvature / (4 * steps^2); add detail only
        // where the bend needs it, instead of doubling every vertex globally.
        // 2026-10-26：阈值 0.18→0.06、步数上限 8→14 —— 细一点的弯也圆滑，
        // 直线段仍保留原始顶点（顶点按需涨，不是全库翻倍）。
        if (curvature < 0.06) {
            result.push(point);
            continue;
        }
        const steps = Math.min(14, Math.max(2, Math.ceil(Math.sqrt(curvature / 0.24))));
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
    /**
     * 🔴 [2026-10-26 主人令「河流更圆滑」] 最后做一遍**松弛**（relaxation）：
     * 把每个内点往「前后邻点的中点」挪一小步。
     *
     * 关键点：这里**只挪点、不加点** —— 缩放时 Leaflet 要重投影的顶点数不变，
     * 所以不会回到主人 2026-09-12 之前那次「一圆滑就卡」（案例 D 的锅是顶点数暴涨）。
     * 端点（首尾）不动：支流汇入、湖口对位靠的就是端点固定。
     */
    const relaxPasses = 2;
    const relaxStrength = 0.45;
    for (let pass = 0; pass < relaxPasses; pass++) {
        for (let i = 1; i < result.length - 1; i++) {
            const previous = result[i - 1], point = result[i], next = result[i + 1];
            const midX = (previous[0] + next[0]) / 2;
            const midY = (previous[1] + next[1]) / 2;
            result[i] = [
                point[0] + (midX - point[0]) * relaxStrength,
                point[1] + (midY - point[1]) * relaxStrength,
            ];
        }
    }
    return result;
}
