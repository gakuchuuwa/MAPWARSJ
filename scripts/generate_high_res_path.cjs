/*
 * Generate High-Resolution Path for Qin Direct Road (Simulation)
 * Simulates a mountain ridge path based on key historical waypoints.
 */

const fs = require('fs');

// Key Waypoints (Lat, Lng) - Based on historical research (Ziwuling Ridge)
// South to North
const waypoints = [
    [34.80, 108.60], // Start: Chunhua (LinGuang Palace)
    [35.10, 108.30], // Xunyi
    [35.40, 108.50], // Intersection with Ziwuling Ridge South
    [35.60, 109.00], // West of Huangling (Ridge)
    [36.00, 109.10], // West of Fuxian (Ridge)
    [36.40, 109.15], // West of Ganquan
    [36.80, 109.10], // Zhidan / Ansai Border
    [37.20, 109.20],
    [37.50, 109.30], // East of Jingbian
    [38.20, 109.50], // West of Yulin (Red Stone Gorge area)
    [39.00, 109.70], // Ejin Horo Banner
    [39.80, 109.90], // Dongsheng
    [40.20, 109.95], // Crossing Yellow River (Approx)
    [40.55, 110.00]  // End: Baotou (Jiuyuan / Machi Ancient City)
];

function interpolate(p1, p2, t) {
    return [
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t
    ];
}

// Add some "natural" jitter to simulate winding mountain ridge
function addJitter(point, intensity) {
    return [
        point[0] + (Math.random() - 0.5) * intensity,
        point[1] + (Math.random() - 0.5) * intensity
    ];
}

// Catmull-Rom Spline for smooth curve through points
function catmullRom(p0, p1, p2, p3, t) {
    const v0 = (p2[0] - p0[0]) * 0.5;
    const v1 = (p3[0] - p1[0]) * 0.5;
    const t2 = t * t;
    const t3 = t * t * t;

    return [
        (2 * p1[0] - 2 * p2[0] + v0 + v1) * t3 + (-3 * p1[0] + 3 * p2[0] - 2 * v0 - v1) * t2 + v0 * t + p1[0],
        (2 * p1[1] - 2 * p2[1] + v0 + v1) * t3 + (-3 * p1[1] + 3 * p2[1] - 2 * v0 - v1) * t2 + v0 * t + p1[1]
    ];
}

const detailedPoints = [];

// Main generation loop
for (let i = 0; i < waypoints.length - 1; i++) {
    const p0 = waypoints[Math.max(0, i - 1)];
    const p1 = waypoints[i];
    const p2 = waypoints[i + 1];
    const p3 = waypoints[Math.min(waypoints.length - 1, i + 2)];

    // Distance metric to determine point density
    const dist = Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));
    const steps = Math.max(10, Math.floor(dist * 100)); // ~1 point per km equivalent logic

    for (let t = 0; t < 1; t += 1 / steps) {
        let pt = catmullRom(p0, p1, p2, p3, t);

        // Add micro-jitter for "hand-drawn" historical feel, less perfect
        pt = addJitter(pt, 0.002);

        // GeoJSON uses [lng, lat]
        detailedPoints.push([Number(pt[1].toFixed(5)), Number(pt[0].toFixed(5))]);
    }
}

// Add last point
const last = waypoints[waypoints.length - 1];
detailedPoints.push([last[1], last[0]]);

// console.log(JSON.stringify(detailedPoints));
fs.writeFileSync(__dirname + '/qin_zhidao.json', JSON.stringify(detailedPoints));
console.log('Successfully wrote to qin_zhidao.json');
