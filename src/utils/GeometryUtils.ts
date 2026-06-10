/**
 * Geometry Utility Functions
 */

/**
 * Chaikin Smoothing Algorithm (Corner Cutting)
 * Recursively smooths a polyline by cutting corners.
 * Preserves start and end points.
 * 
 * @param points Array of [x, y] or [lat, lng] coordinates
 * @param iterations Number of smoothing iterations (default 3 is good for roads)
 * @returns Smoothed array of coordinates
 */
export function chaikinSmooth(points: [number, number][], iterations: number): [number, number][] {
    if (iterations <= 0 || points.length < 3) return points;

    let output: [number, number][] = [];

    // Preserve start point
    output.push(points[0]);

    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];

        // Q = 0.75 * P0 + 0.25 * P1
        const Q: [number, number] = [
            0.75 * p0[0] + 0.25 * p1[0],
            0.75 * p0[1] + 0.25 * p1[1]
        ];

        // R = 0.25 * P0 + 0.75 * P1
        const R: [number, number] = [
            0.25 * p0[0] + 0.75 * p1[0],
            0.25 * p0[1] + 0.75 * p1[1]
        ];

        output.push(Q);
        output.push(R);
    }

    // Preserve end point
    output.push(points[points.length - 1]);

    return chaikinSmooth(output, iterations - 1);
}

/**
 * Remove Backtrack Points (Direction Reversal Filter)
 * 
 * Detects points where the road sharply reverses direction (> maxAngle degrees)
 * and removes them. This fixes junction-stitching artifacts where two road
 * network segments meet at an angle, creating a small backtrack/hook.
 * 
 * Preserves first and last points.
 * 
 * @param points Array of coordinates
 * @param maxAngleDeg Maximum allowed angle change (default 100° — anything sharper is removed)
 */
export function removeBacktracks(points: [number, number][], maxAngleDeg: number = 100): [number, number][] {
    if (points.length < 3) return points;

    const result: [number, number][] = [points[0]];

    for (let i = 1; i < points.length - 1; i++) {
        const prev = result[result.length - 1]; // Use last accepted point
        const curr = points[i];
        const next = points[i + 1];

        // Vectors: prev→curr and curr→next
        const dx1 = curr[0] - prev[0];
        const dy1 = curr[1] - prev[1];
        const dx2 = next[0] - curr[0];
        const dy2 = next[1] - curr[1];

        // Skip zero-length segments
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        if (len1 < 1e-10 || len2 < 1e-10) continue;

        // Dot product gives cos(angle)
        const dot = dx1 * dx2 + dy1 * dy2;
        const cosAngle = dot / (len1 * len2);

        // cos(100°) ≈ -0.17, cos(120°) ≈ -0.5, cos(180°) = -1
        const maxAngleRad = maxAngleDeg * Math.PI / 180;
        const cosThreshold = Math.cos(maxAngleRad);

        if (cosAngle < cosThreshold) {
            // Sharp reversal detected — skip this point
            continue;
        }

        result.push(curr);
    }

    // Always keep last point
    result.push(points[points.length - 1]);
    return result;
}

/**
 * Full Road Smoothing Pipeline
 * 1. Remove backtrack artifacts (junction hooks)
 * 2. Chaikin smooth to create curves
 */
export function smoothRoad(points: [number, number][], chaikinIterations: number = 3): [number, number][] {
    const cleaned = removeBacktracks(points, 100);
    return chaikinSmooth(cleaned, chaikinIterations);
}

