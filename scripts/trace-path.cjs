#!/usr/bin/env node
/**
 * trace-path.cjs — 详细打印 Dijkstra 找到的路径每一段, 看绕到哪里去了
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const [lng1, lat1, lng2, lat2] = args.slice(0, 4).map(Number);
const BRIDGE_KM = parseInt(args[4] || '50');

const geojsonPath = path.join(__dirname, '..', 'public', 'assets', 'roads_filtered.geojson');
const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

function haversine(lng1, lat1, lng2, lat2) {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

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

for (const f of data.features) {
    if ((f.properties||{}).expressway === 1) continue;
    const c = f.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    for (let i = 0; i < c.length - 1; i++) {
        const n1 = getOrAdd(c[i][1], c[i][0]);
        const n2 = getOrAdd(c[i+1][1], c[i+1][0]);
        if (n1 === n2) continue;
        const w = haversine(c[i][0], c[i][1], c[i+1][0], c[i+1][1]);
        adj.get(n1).push({to: n2, weight: w, isBridge: false});
        adj.get(n2).push({to: n1, weight: w, isBridge: false});
    }
}

// 桥接 (使用参数指定的阈值) - 桥接 degree 1-4 的节点
const endpoints = [];
for (let id = 0; id < nodes.length; id++) {
    const d = (adj.get(id) || []).length;
    if (d >= 1 && d <= 4) endpoints.push(id);
}
const cellSize = 0.1;
const grid = new Map();
for (const id of endpoints) {
    const n = nodes[id];
    const k = `${Math.floor(n.lng/cellSize)}_${Math.floor(n.lat/cellSize)}`;
    if (!grid.has(k)) grid.set(k, []);
    grid.get(k).push(id);
}
let bridged = 0;
const searchRange = Math.ceil(BRIDGE_KM / 11);
const bridgedPairs = new Set();
const pairKey = (a, b) => a < b ? `${a}_${b}` : `${b}_${a}`;
for (const id of endpoints) {
    const node = nodes[id];
    const connectedTo = new Set((adj.get(id)||[]).map(e=>e.to));
    const cx = Math.floor(node.lng / cellSize);
    const cy = Math.floor(node.lat / cellSize);
    // 收集所有 ≤ BRIDGE_KM 的候选, 取最近 3 个
    const candidates = [];
    for (let dx = -searchRange; dx <= searchRange; dx++) {
        for (let dy = -searchRange; dy <= searchRange; dy++) {
            const cellNodes = grid.get(`${cx+dx}_${cy+dy}`);
            if (!cellNodes) continue;
            for (const otherId of cellNodes) {
                if (otherId === id || connectedTo.has(otherId)) continue;
                if (bridgedPairs.has(pairKey(id, otherId))) continue;
                const other = nodes[otherId];
                const d = haversine(node.lng, node.lat, other.lng, other.lat);
                if (d <= BRIDGE_KM) candidates.push({otherId, d});
            }
        }
    }
    candidates.sort((a,b) => a.d - b.d);
    const topK = candidates.slice(0, 3);
    for (const c of topK) {
        const w = c.d * 1.2;
        adj.get(id).push({to: c.otherId, weight: w, isBridge: true});
        adj.get(c.otherId).push({to: id, weight: w, isBridge: true});
        bridgedPairs.add(pairKey(id, c.otherId));
        bridged++;
    }
}
console.log(`Graph: ${nodes.length} nodes, ${endpoints.length} endpoints, bridged ${bridged} pairs at ≤${BRIDGE_KM}km`);

function nearest(lng, lat) {
    let bestId = -1, bestDist = Infinity;
    for (let i = 0; i < nodes.length; i++) {
        const d = haversine(lng, lat, nodes[i].lng, nodes[i].lat);
        if (d < bestDist) { bestDist = d; bestId = i; }
    }
    return {id: bestId, dist: bestDist};
}

const s = nearest(lng1, lat1), e = nearest(lng2, lat2);
console.log(`Start: node ${s.id} @ ${s.dist.toFixed(1)}km`);
console.log(`End:   node ${e.id} @ ${e.dist.toFixed(1)}km`);

// Dijkstra
class MinHeap { constructor(){this.h=[]} push(i){this.h.push(i);let p=this.h.length-1;while(p>0){const q=(p-1)>>1;if(this.h[q].d<=this.h[p].d)break;[this.h[q],this.h[p]]=[this.h[p],this.h[q]];p=q;}} pop(){if(!this.h.length)return null;const t=this.h[0];const l=this.h.pop();if(this.h.length){this.h[0]=l;let p=0;const n=this.h.length;while(1){const a=2*p+1,b=2*p+2;let s=p;if(a<n&&this.h[a].d<this.h[s].d)s=a;if(b<n&&this.h[b].d<this.h[s].d)s=b;if(s===p)break;[this.h[s],this.h[p]]=[this.h[p],this.h[s]];p=s;}}return t;} get size(){return this.h.length}}

const dist = new Float32Array(nodes.length).fill(Infinity);
const prev = new Int32Array(nodes.length).fill(-1);
const prevIsBridge = new Uint8Array(nodes.length);
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
            prevIsBridge[ed.to] = ed.isBridge ? 1 : 0;
            pq.push({id: ed.to, d: nd});
        }
    }
}

if (dist[e.id] === Infinity) {
    console.log('❌ No path');
    return;
}

// 打印路径节点
const pathIds = [];
const pathBridges = [];
let c = e.id;
while (c !== -1) {
    pathIds.unshift(c);
    if (c !== e.id) pathBridges.unshift(prevIsBridge[pathIds[1]]);
    c = prev[c];
}
console.log(`Path: ${pathIds.length} nodes`);
console.log(`\n=== 路径关键节点(每10个打一个) ===`);
for (let i = 0; i < pathIds.length; i += 10) {
    const n = nodes[pathIds[i]];
    console.log(`  [${i}] node=${pathIds[i]} (${n.lng.toFixed(3)}, ${n.lat.toFixed(3)})`);
}
console.log(`  [${pathIds.length-1}] node=${pathIds[pathIds.length-1]} (${nodes[pathIds[pathIds.length-1]].lng.toFixed(3)}, ${nodes[pathIds[pathIds.length-1]].lat.toFixed(3)})`);

// 总结
let actualKm = 0;
let bridgeCount = 0;
let bridgeKm = 0;
for (let i = 0; i < pathIds.length - 1; i++) {
    const a = nodes[pathIds[i]], b = nodes[pathIds[i+1]];
    const d = haversine(a.lng, a.lat, b.lng, b.lat);
    actualKm += d;
    if (pathBridges[i]) {
        bridgeCount++;
        bridgeKm += d;
    }
}
const directKm = haversine(lng1, lat1, lng2, lat2);
console.log(`\nDirect: ${directKm.toFixed(1)} km`);
console.log(`Actual: ${actualKm.toFixed(1)} km (${(actualKm/directKm).toFixed(2)}x detour)`);
console.log(`Bridges used: ${bridgeCount}, total bridge km: ${bridgeKm.toFixed(1)}`);
