/**
 * bake_network.mjs
 * 
 * 将 radial_network.geojson 中的直线边，通过 Natural Earth 道路网 (NE Dijkstra) 弯曲贴合地形。
 * 1. 读取 roads_filtered.geojson 并构图 (仅一次)
 * 2. 读取 radial_network.geojson
 * 3. 对每一条非 manual_seed 的直线边，用 Dijkstra 寻找最短路径
 * 4. 如果找到路径，将其简化 (Douglas-Peucker) 并替换直线
 * 5. 对于 manual_seed，保留现有的直线或是从原文件中恢复（此处逻辑：从 VectorRoadData.ts 恢复人工绘制坐标）
 * 6. 生成合并后的 FeatureCollection 并写回 VectorRoadData.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RADIAL_GEOJSON = path.join(__dirname, '../public/assets/radial_network.geojson');
const NE_ROADS = path.join(__dirname, '../public/assets/roads_filtered.geojson');
const VECTOR_ROADS_TS = path.join(__dirname, '../src/data/VectorRoadData.ts');

function haversineKm(lng1, lat1, lng2, lat2) {
    const R = 6371;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

// ── Douglas-Peucker ──
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

function main() {
    console.log(`[1/4] 加载路网拓扑文件...`);
    const radialRaw = fs.readFileSync(RADIAL_GEOJSON, 'utf8');
    const radialData = JSON.parse(radialRaw);
    console.log(`      共需处理 ${radialData.features.length} 条边。`);

    console.log(`[2/4] 构建 Natural Earth 道路图...`);
    const neRaw = fs.readFileSync(NE_ROADS, 'utf8');
    const neData = JSON.parse(neRaw);
    const featuresKept = neData.features.filter(f => (f.properties || {}).expressway !== 1);
    
    const nodes = [];
    const adj = [];
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
    console.log(`      图构建完成: ${nodes.length} 个节点。`);

    function nearestNode(lng, lat) {
        let bestId = -1, bestDist = Infinity;
        for (let i = 0; i < nodes.length; i++) {
            const d = haversineKm(lng, lat, nodes[i].lng, nodes[i].lat);
            if (d < bestDist) { bestDist = d; bestId = i; }
        }
        return { id: bestId, dist: bestDist };
    }

    console.log(`[3/4] 强制为所有边运行 Dijkstra 寻路...`);
    const bakedFeatures = [];
    let successCount = 0;
    let fallbackCount = 0;
    let droppedCount = 0;

    for (let i = 0; i < radialData.features.length; i++) {
        const feat = radialData.features[i];
        const props = feat.properties;
        const coords = feat.geometry.coordinates;
        const [startLng, startLat] = coords[0];
        const [endLng, endLat] = coords[coords.length - 1];

        if (i % 50 === 0) console.log(`      已处理 ${i}/${radialData.features.length} 条边...`);

        const startN = nearestNode(startLng, startLat);
        const endN = nearestNode(endLng, endLat);

        // 如果距离道路太远
        if (startN.dist > 50 || endN.dist > 50) {
            if (props.allowWater) {
                fallbackCount++;
                feat.properties.type = 'path';
                bakedFeatures.push(feat);
            } else {
                droppedCount++;
            }
            continue;
        }

        const N = nodes.length;
        const dist = new Float32Array(N).fill(Infinity);
        const prev = new Int32Array(N).fill(-1);
        const prevSeg = new Array(N).fill(null);
        const visited = new Uint8Array(N);

        dist[startN.id] = 0;
        const pq = new MinHeap();
        pq.push({ id: startN.id, d: 0 });

        while (pq.size) {
            const cur = pq.pop();
            if (visited[cur.id]) continue;
            visited[cur.id] = 1;
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

        if (dist[endN.id] === Infinity || (!props.allowWater && dist[endN.id] > 500)) {
            // 没找到路，或者实际寻路距离太长（超过 500km）
            if (props.allowWater) {
                fallbackCount++;
                feat.properties.type = 'path';
                bakedFeatures.push(feat);
            } else {
                droppedCount++;
            }
            continue;
        }

        const pathCoords = [];
        let cur = endN.id;
        while (cur !== startN.id && cur !== -1) {
            const seg = prevSeg[cur];
            if (seg) {
                if (pathCoords.length === 0) pathCoords.unshift(seg[1]);
                pathCoords.unshift(seg[0]);
            }
            cur = prev[cur];
        }

        const finalPath = [
            [startLng, startLat],
            ...pathCoords,
            [endLng, endLat]
        ];

        const dedup = [];
        for (const c of finalPath) {
            const last = dedup[dedup.length - 1];
            if (!last || last[0] !== c[0] || last[1] !== c[1]) {
                dedup.push(c);
            }
        }

        const simplified = douglasPeucker(dedup, 0.001); // 约100m精度
        feat.geometry.coordinates = simplified;
        feat.properties.type = 'road';
        
        // 由于弯弯绕绕，可能比原几何距离长，可以按一定比例惩罚或者直接记录实际长度
        // 简单处理：保留原始参考距离，或换成实际路长
        // feat.properties.length_km = dist[endN.id];
        
        successCount++;
        bakedFeatures.push(feat);
    }
    
    console.log(`      处理完成！成功贴合地形: ${successCount} 条，跨海直线保留: ${fallbackCount} 条，因死胡同剔除废线: ${droppedCount} 条。`);

    console.log(`[4/4] 烘焙输出至 VectorRoadData.ts ...`);
    
    let tsContent = `// 自动生成于: ${new Date().toISOString()}
export interface VectorRoadFeature {
    type: 'Feature';
    properties: {
        name: string;
        type: 'plank' | 'path' | 'road';
        color?: string;
        id: string;
        startYear?: number;
        endYear?: number;
        startConnection?: string;
        endConnection?: string;
    };
    geometry: {
        type: 'LineString';
        coordinates: [number, number][];
    };
}

export const VECTOR_ROAD_DATA: { type: 'FeatureCollection', features: VectorRoadFeature[] } = {
    type: 'FeatureCollection',
    features: [
`;

    for (const f of bakedFeatures) {
        const p = f.properties;
        const type = p.type || 'road';
        // 构建标准对象
        const outF = {
            type: 'Feature',
            properties: {
                name: p.name || `${p.fromName}-${p.toName}`,
                type: type,
                id: `road_${p.from}_${p.to}_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                startConnection: p.from,
                endConnection: p.to,
            },
            geometry: f.geometry
        };
        tsContent += `        ${JSON.stringify(outF)},\n`;
    }

    tsContent += `    ]
};
`;

    fs.writeFileSync(VECTOR_ROADS_TS, tsContent, 'utf8');
    console.log(`✅ 成功写入 ${VECTOR_ROADS_TS} (${(Buffer.byteLength(tsContent, 'utf8') / 1024 / 1024).toFixed(2)} MB)`);
}

main();
