#!/usr/bin/env node
/**
 * find-road.cjs — 在 roads_filtered.geojson 上为两个坐标点跑 Dijkstra 寻路
 *
 * 用法:
 *   node scripts/find-road.cjs <startLng> <startLat> <endLng> <endLat>
 *
 * 例:
 *   node scripts/find-road.cjs 108.93 34.27 112.45 34.62   # 长安 -> 洛阳
 *
 * 输出: 路径坐标 JSON 数组 [[lng,lat],...] 写到 stdout
 *       日志/调试信息写到 stderr
 *
 * 过滤: 跳过 expressway=1 的高速公路, 只走国道/省道/一般路 (近似古驿道)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 4) {
    console.error('Usage: node find-road.cjs <startLng> <startLat> <endLng> <endLat> [dataFile]');
    console.error('  dataFile defaults to roads_filtered.geojson (Natural Earth)');
    console.error('  Use roads_osm_test.geojson for OSM data');
    process.exit(1);
}
const startLng = Number(args[0]);
const startLat = Number(args[1]);
const endLng = Number(args[2]);
const endLat = Number(args[3]);
const dataFile = args[4] || 'roads_filtered.geojson';

const geojsonPath = path.join(__dirname, '..', 'public', 'assets', dataFile);
console.error(`Loading ${geojsonPath}...`);
const raw = fs.readFileSync(geojsonPath, 'utf8');
const data = JSON.parse(raw);
console.error(`Loaded ${data.features.length} features`);

// 过滤掉高速
const featuresKept = data.features.filter(f => (f.properties || {}).expressway !== 1);
console.error(`After filtering expressway: ${featuresKept.length}`);

// ── 构图 ──
const nodes = []; // {lng, lat}
const adj = [];   // adj[i] = [{to, weight, segCoords}]
const nodeMap = new Map();

const nodeKey = (lng, lat) => `${Math.round(lng * 10000)},${Math.round(lat * 10000)}`;

function getOrAddNode(lng, lat) {
    const key = nodeKey(lng, lat);
    const existing = nodeMap.get(key);
    if (existing !== undefined) return existing;
    const id = nodes.length;
    nodes.push({ lng, lat });
    adj.push([]);
    nodeMap.set(key, id);
    return id;
}

function haversineKm(lng1, lat1, lng2, lat2) {
    const R = 6371;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

for (const feat of featuresKept) {
    const coords = feat.geometry && feat.geometry.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) continue;
    for (let i = 0; i < coords.length - 1; i++) {
        const [lng1, lat1] = coords[i];
        const [lng2, lat2] = coords[i + 1];
        const n1 = getOrAddNode(lng1, lat1);
        const n2 = getOrAddNode(lng2, lat2);
        if (n1 === n2) continue;
        const w = haversineKm(lng1, lat1, lng2, lat2);
        adj[n1].push({ to: n2, weight: w, segCoords: [coords[i], coords[i + 1]] });
        adj[n2].push({ to: n1, weight: w, segCoords: [coords[i + 1], coords[i]] });
    }
}

console.error(`Graph: ${nodes.length} nodes`);

// ── 二叉堆 ──
class MinHeap {
    constructor() { this.h = []; }
    push(item) {
        this.h.push(item);
        let i = this.h.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.h[p].d <= this.h[i].d) break;
            [this.h[p], this.h[i]] = [this.h[i], this.h[p]];
            i = p;
        }
    }
    pop() {
        if (!this.h.length) return null;
        const top = this.h[0];
        const last = this.h.pop();
        if (this.h.length) {
            this.h[0] = last;
            let i = 0;
            const n = this.h.length;
            while (true) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let s = i;
                if (l < n && this.h[l].d < this.h[s].d) s = l;
                if (r < n && this.h[r].d < this.h[s].d) s = r;
                if (s === i) break;
                [this.h[s], this.h[i]] = [this.h[i], this.h[s]];
                i = s;
            }
        }
        return top;
    }
    get size() { return this.h.length; }
}

// ── 找最近节点 ──
function nearestNode(lng, lat) {
    let bestId = -1, bestDist = Infinity;
    for (let i = 0; i < nodes.length; i++) {
        const d = haversineKm(lng, lat, nodes[i].lng, nodes[i].lat);
        if (d < bestDist) { bestDist = d; bestId = i; }
    }
    return { id: bestId, dist: bestDist };
}

console.error(`Searching nearest nodes...`);
const startN = nearestNode(startLng, startLat);
const endN = nearestNode(endLng, endLat);
console.error(`  Start node ${startN.id} at ${startN.dist.toFixed(2)}km from input`);
console.error(`  End   node ${endN.id} at ${endN.dist.toFixed(2)}km from input`);

if (startN.dist > 30) console.error(`  ⚠️ Start point ${startN.dist.toFixed(1)}km from nearest road`);
if (endN.dist > 30) console.error(`  ⚠️ End point ${endN.dist.toFixed(1)}km from nearest road`);

// ── Dijkstra ──
console.error(`Running Dijkstra...`);
const N = nodes.length;
const dist = new Float32Array(N).fill(Infinity);
const prev = new Int32Array(N).fill(-1);
const prevSeg = new Array(N).fill(null);
const visited = new Uint8Array(N);

dist[startN.id] = 0;
const pq = new MinHeap();
pq.push({ id: startN.id, d: 0 });

let processed = 0;
while (pq.size) {
    const cur = pq.pop();
    if (visited[cur.id]) continue;
    visited[cur.id] = 1;
    processed++;
    if (cur.id === endN.id) break;
    for (const e of adj[cur.id]) {
        if (visited[e.to]) continue;
        const nd = cur.d + e.weight;
        if (nd < dist[e.to]) {
            dist[e.to] = nd;
            prev[e.to] = cur.id;
            prevSeg[e.to] = e.segCoords;
            pq.push({ id: e.to, d: nd });
        }
    }
}

console.error(`Processed ${processed} nodes`);

if (dist[endN.id] === Infinity) {
    console.error(`❌ No path found from start to end!`);
    process.exit(2);
}

console.error(`✓ Path length: ${dist[endN.id].toFixed(2)} km`);

// ── 重建路径 ──
const pathCoords = [];
let cur = endN.id;
while (cur !== startN.id && cur !== -1) {
    const seg = prevSeg[cur];
    if (seg) {
        // seg is [from, to] in lng/lat
        if (pathCoords.length === 0) {
            pathCoords.unshift(seg[1]);  // first endpoint added
        }
        pathCoords.unshift(seg[0]);
    }
    cur = prev[cur];
}

// 在两端拼接精确的起点和终点坐标
const finalPath = [
    [startLng, startLat],
    ...pathCoords,
    [endLng, endLat]
];

// 去重相邻坐标 (有时拼接处重复)
const dedup = [];
for (const c of finalPath) {
    const last = dedup[dedup.length - 1];
    if (!last || last[0] !== c[0] || last[1] !== c[1]) {
        dedup.push(c);
    }
}

console.error(`Final path: ${dedup.length} coordinates (before simplification)`);

// ── Douglas-Peucker 简化 (减少节点数, 保留形状) ──
// 容差 = 约 100m (0.001°) — 平衡精度与体积
function perpDist(p, a, b) {
    const [px, py] = p;
    const [ax, ay] = a;
    const [bx, by] = b;
    const dx = bx - ax, dy = by - ay;
    if (dx === 0 && dy === 0) {
        const dpx = px - ax, dpy = py - ay;
        return Math.sqrt(dpx * dpx + dpy * dpy);
    }
    const t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    const ct = Math.max(0, Math.min(1, t));
    const cx = ax + ct * dx, cy = ay + ct * dy;
    const ex = px - cx, ey = py - cy;
    return Math.sqrt(ex * ex + ey * ey);
}
function douglasPeucker(points, epsilon) {
    if (points.length < 3) return points;
    let maxDist = 0, maxIdx = 0;
    const first = points[0], last = points[points.length - 1];
    for (let i = 1; i < points.length - 1; i++) {
        const d = perpDist(points[i], first, last);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon) {
        const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
        const right = douglasPeucker(points.slice(maxIdx), epsilon);
        return [...left.slice(0, -1), ...right];
    }
    return [first, last];
}

const simplified = douglasPeucker(dedup, 0.001);  // 约 100m 容差
console.error(`Simplified: ${dedup.length} → ${simplified.length} coordinates (${(simplified.length / dedup.length * 100).toFixed(1)}%)`);
console.log(JSON.stringify(simplified));
