#!/usr/bin/env node
/**
 * test-bridge.cjs — 模拟编辑器的端点桥接逻辑, 测试 NE 数据上能否找到路径
 * 用法: node scripts/test-bridge.cjs <lng1> <lat1> <lng2> <lat2>
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const [lng1, lat1, lng2, lat2] = args.slice(0, 4).map(Number);

const geojsonPath = path.join(__dirname, '..', 'public', 'assets', 'roads_filtered.geojson');
const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

function haversine(lng1, lat1, lng2, lat2) {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

// ── 编辑器风格的图构建 (5km snap) ──
const SNAP = 0.05;
const snapKey = (lat, lng) => `${(Math.round(lat/SNAP)*SNAP).toFixed(3)}_${(Math.round(lng/SNAP)*SNAP).toFixed(3)}`;

const nodes = [];
const nodeMap = new Map();
const adj = new Map();

function getOrAdd(lat, lng) {
    const key = snapKey(lat, lng);
    if (nodeMap.has(key)) return nodeMap.get(key);
    const id = nodes.length;
    nodes.push({lat, lng});
    nodeMap.set(key, id);
    adj.set(id, []);
    return id;
}

// 过滤高速 + 构建
let segments = 0;
for (const f of data.features) {
    if ((f.properties||{}).expressway === 1) continue;
    const c = f.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    for (let i = 0; i < c.length - 1; i++) {
        const n1 = getOrAdd(c[i][1], c[i][0]);
        const n2 = getOrAdd(c[i+1][1], c[i+1][0]);
        if (n1 === n2) continue;
        const w = haversine(c[i][0], c[i][1], c[i+1][0], c[i+1][1]);
        adj.get(n1).push({to: n2, weight: w});
        adj.get(n2).push({to: n1, weight: w});
        segments++;
    }
}
console.log(`Graph: ${nodes.length} nodes, ${segments} segments`);

// ── 端点桥接 ──
function bridgeEndpoints(maxKm) {
    const endpoints = [];
    for (let id = 0; id < nodes.length; id++) {
        if ((adj.get(id) || []).length === 1) endpoints.push(id);
    }
    console.log(`Endpoints (degree=1): ${endpoints.length}`);

    const cellSize = 0.1;
    const grid = new Map();
    for (const id of endpoints) {
        const n = nodes[id];
        const k = `${Math.floor(n.lng/cellSize)}_${Math.floor(n.lat/cellSize)}`;
        if (!grid.has(k)) grid.set(k, []);
        grid.get(k).push(id);
    }

    const used = new Set();
    let bridged = 0;
    const searchRange = Math.ceil(maxKm / 11);
    for (const id of endpoints) {
        if (used.has(id)) continue;
        const node = nodes[id];
        const connectedTo = new Set((adj.get(id)||[]).map(e=>e.to));
        const cx = Math.floor(node.lng / cellSize);
        const cy = Math.floor(node.lat / cellSize);

        let bestId = -1, bestDist = Infinity;
        for (let dx = -searchRange; dx <= searchRange; dx++) {
            for (let dy = -searchRange; dy <= searchRange; dy++) {
                const cellNodes = grid.get(`${cx+dx}_${cy+dy}`);
                if (!cellNodes) continue;
                for (const otherId of cellNodes) {
                    if (otherId === id || used.has(otherId) || connectedTo.has(otherId)) continue;
                    const other = nodes[otherId];
                    const d = haversine(node.lng, node.lat, other.lng, other.lat);
                    if (d < bestDist && d <= maxKm) {
                        bestDist = d; bestId = otherId;
                    }
                }
            }
        }
        if (bestId !== -1) {
            const w = bestDist * 2.5;
            adj.get(id).push({to: bestId, weight: w});
            adj.get(bestId).push({to: id, weight: w});
            used.add(id);
            used.add(bestId);
            bridged++;
        }
    }
    console.log(`Bridged ${bridged} endpoint pairs (≤${maxKm}km)`);
}

bridgeEndpoints(20);

// ── 找最近节点 ──
function nearest(lng, lat) {
    let bestId = -1, bestDist = Infinity;
    for (let i = 0; i < nodes.length; i++) {
        const d = haversine(lng, lat, nodes[i].lng, nodes[i].lat);
        if (d < bestDist) { bestDist = d; bestId = i; }
    }
    return {id: bestId, dist: bestDist};
}

const s = nearest(lng1, lat1), e = nearest(lng2, lat2);
console.log(`Start: node ${s.id} @ ${s.dist.toFixed(2)}km, lat=${nodes[s.id].lat.toFixed(3)}, lng=${nodes[s.id].lng.toFixed(3)}`);
console.log(`End:   node ${e.id} @ ${e.dist.toFixed(2)}km, lat=${nodes[e.id].lat.toFixed(3)}, lng=${nodes[e.id].lng.toFixed(3)}`);

// ── Dijkstra ──
class MinHeap {
    constructor() { this.h = []; }
    push(item) { this.h.push(item); let i = this.h.length-1; while (i > 0) { const p = (i-1)>>1; if (this.h[p].d <= this.h[i].d) break; [this.h[p], this.h[i]] = [this.h[i], this.h[p]]; i = p; } }
    pop() { if (!this.h.length) return null; const t = this.h[0]; const l = this.h.pop(); if (this.h.length) { this.h[0] = l; let i = 0, n = this.h.length; while (true) { const a = 2*i+1, b = 2*i+2; let s = i; if (a < n && this.h[a].d < this.h[s].d) s = a; if (b < n && this.h[b].d < this.h[s].d) s = b; if (s === i) break; [this.h[s], this.h[i]] = [this.h[i], this.h[s]]; i = s; } } return t; }
    get size() { return this.h.length; }
}

const dist = new Float32Array(nodes.length).fill(Infinity);
const prev = new Int32Array(nodes.length).fill(-1);
const visited = new Uint8Array(nodes.length);
dist[s.id] = 0;
const pq = new MinHeap();
pq.push({id: s.id, d: 0});
while (pq.size) {
    const cur = pq.pop();
    if (visited[cur.id]) continue;
    visited[cur.id] = 1;
    if (cur.id === e.id) break;
    for (const ed of adj.get(cur.id) || []) {
        if (visited[ed.to]) continue;
        const nd = cur.d + ed.weight;
        if (nd < dist[ed.to]) {
            dist[ed.to] = nd;
            prev[ed.to] = cur.id;
            pq.push({id: ed.to, d: nd});
        }
    }
}

if (dist[e.id] === Infinity) {
    console.log(`❌ No path found! Components disconnected.`);
} else {
    const direct = haversine(lng1, lat1, lng2, lat2);
    console.log(`✓ Path found! Weight distance: ${dist[e.id].toFixed(2)}km, direct: ${direct.toFixed(2)}km`);

    // 重建路径计算实际公里
    const pathIds = [];
    let c = e.id;
    while (c !== -1) { pathIds.unshift(c); c = prev[c]; }
    let actualKm = 0;
    for (let i = 0; i < pathIds.length - 1; i++) {
        const a = nodes[pathIds[i]], b = nodes[pathIds[i+1]];
        actualKm += haversine(a.lng, a.lat, b.lng, b.lat);
    }
    console.log(`Actual path length: ${actualKm.toFixed(2)}km, nodes: ${pathIds.length}`);
    console.log(`Detour ratio: ${(actualKm/direct).toFixed(2)}x`);
}
