/**
 * audit_radial_network.mjs (v3.0 Gabriel Graph)
 * 
 * 核心：放弃 Hub-and-Spoke，改用 Gabriel Graph 平面网
 * 1. 候选边生成 (<=333km, 不跨水)
 * 2. Gabriel 过滤
 * 3. 注入 363 条手工种子边
 * 4. PREFERRED_INNER 特例兜底
 * 5. 孤岛 Rescue
 * 6. 可视化输出
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CITIES_TS = path.join(__dirname, '../src/data/cities_v2.ts');
const ROADS_TS = path.join(__dirname, '../src/data/VectorRoadData.ts');
const OUTPUT_GEOJSON = path.join(__dirname, '../public/assets/radial_network.geojson');

const MAX_HOP_KM = 333;

const PREFERRED_INNER = {
    'city_gongbu':      { target: 'city_luoxie',      reason: '川藏南线起点' },
    'city_tainan':      { target: 'city_qingjingsi',  reason: '闽台航路', allowWater: true },
    'city_mailingguan': { target: 'city_yongzhou_hn', reason: '湘桂走廊' },
    'city_yongan':      { target: 'city_lingqu',      reason: '桂林军管' },
    'city_huashan':     { target: 'city_yongzhou',    reason: '骆越→邕州' },
    // 强制把首里和赤木名城连上
    'city_shuri':       { target: 'city_akakinagusuku', reason: '琉球列岛航线', allowWater: true },
};

const WATER_BODIES = {
    BOHAI_OPEN: [
        { lat: 38.0, lng: 120.0 },
        { lat: 40.7, lng: 120.0 },
        { lat: 40.7, lng: 121.3 },
        { lat: 38.0, lng: 121.3 },
    ],
    TAIWAN_STRAIT: [
        { lat: 23.0, lng: 118.5 },
        { lat: 26.0, lng: 118.5 },
        { lat: 26.0, lng: 120.5 },
        { lat: 23.0, lng: 120.5 },
    ]
};

function distKm(a, b) {
    const R = 6371;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const s = Math.sin(dLat / 2) ** 2 +
              Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function segmentsIntersect(p1, p2, p3, p4) {
    const ccw = (A, B, C) => (C.lat - A.lat) * (B.lng - A.lng) > (B.lat - A.lat) * (C.lng - A.lng);
    return (ccw(p1, p3, p4) !== ccw(p2, p3, p4)) && (ccw(p1, p2, p3) !== ccw(p1, p2, p4));
}

function crossesWater(c1, c2) {
    for (const [name, poly] of Object.entries(WATER_BODIES)) {
        let insideCount = 0;
        let intersectCount = 0;
        const pts = [c1, c2];
        for (const p of pts) {
            let inside = false;
            for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
                const xi = poly[i].lng, yi = poly[i].lat;
                const xj = poly[j].lng, yj = poly[j].lat;
                const intersect = ((yi > p.lat) !== (yj > p.lat))
                    && (p.lng < (xj - xi) * (p.lat - yi) / (yj - yi) + xi);
                if (intersect) inside = !inside;
            }
            if (inside) insideCount++;
        }
        if (insideCount === 1) return name;
        if (insideCount === 2) return name;

        for (let i = 0; i < poly.length; i++) {
            const p3 = poly[i];
            const p4 = poly[(i + 1) % poly.length];
            if (segmentsIntersect(c1, c2, p3, p4)) {
                intersectCount++;
            }
        }
        if (intersectCount > 0) return name;
    }
    return null;
}

// ===== 文化区判定 (同步 RegionSystem.ts 14 区 v4) =====
const LEGACY_REGION_MAP = {
    'SOUTH': 'JIANGNAN', 'NORTHWEST': 'HEXI', 'NOMADIC': 'STEPPE',
    'CENTRAL_WORLD': 'CENTRAL_ASIA', 'WEST_WORLD': 'CENTRAL_ASIA',
    'TROPICS': 'LINGNAN', 'SIBERIA': 'STEPPE', 'MIN': 'LINGNAN',
    'SOUTH_HEMISPHERE': 'CENTRAL', 'NEW_WORLD': 'CENTRAL',
};
const REGION_ORDER = ['CENTRAL','NORTH','JIANGNAN','LINGNAN','BASHU','DIANQIAN','HEXI','WESTERN','TIBET','STEPPE','NORTHEAST','KOREA','JAPAN','CENTRAL_ASIA'];

function getRegion(lat, lng) {
    if (lat > 50.0) {
        if (lng > 120.0) return 'NORTHEAST';
        return 'STEPPE';
    }
    if (lat > 26.0 && lat <= 37.0 && lng >= 76.0 && lng < 103.0) return 'TIBET';
    if (lat > 36.0 && lat <= 41.0 && lng >= 93.0 && lng < 111.0) return 'HEXI';
    if (lat >= 35.0 && lat <= 44.0 && lng >= 75.0 && lng < 93.0) return 'WESTERN';
    if (lng < 75.0) return 'CENTRAL_ASIA';
    if (lat > 41.0 && lng <= 120.0) return 'STEPPE';
    if (lat > 40.0 && lng > 120.0) return 'NORTHEAST';
    if (lng > 127.0) return 'JAPAN';
    if (lat > 33.0 && lng > 123.0 && lng <= 127.0) return 'KOREA';
    if (lat > 36.0 && lat <= 41.0 && lng > 108.0 && lng <= 123.0) return 'NORTH';
    if (lat > 32.0 && lat <= 34.0 && lng > 106.0 && lng <= 108.0) return 'CENTRAL';
    if (lat > 32.0 && lat <= 36.0 && lng > 108.0 && lng <= 123.0) return 'CENTRAL';
    if (lat > 23.5 && lat <= 28.0 && lng > 116.0 && lng <= 120.5) return 'LINGNAN';
    if (lat > 26.0 && lat <= 32.0 && lng > 111.0 && lng <= 123.0) return 'JIANGNAN';
    if (lat <= 26.0 && lng >= 92.0 && lng < 102.0) return 'DIANQIAN';
    if (lat <= 26.0 && lng >= 102.0) return 'LINGNAN';
    if (lat <= 32.0 && lng > 98.0 && lng <= 111.0) {
        if (lat > 28.0 && lng > 103.0 && lng <= 110.0) return 'BASHU';
        return 'DIANQIAN';
    }
    if (lat > 35.0) return 'NORTH';
    if (lat > 33.0) return 'CENTRAL';
    return 'JIANGNAN';
}

function getCityRegion(city) {
    if (city.region) {
        const translated = LEGACY_REGION_MAP[city.region] ?? city.region;
        if (REGION_ORDER.includes(translated)) return translated;
    }
    return getRegion(city.lat, city.lng);
}

function loadCities() {
    let src = fs.readFileSync(CITIES_TS, 'utf8');
    src = src.replace(/^\s*import\b[^;]*;\s*$/gm, '');
    src = src.replace(/^export\s+interface\s+\w+\s*\{[\s\S]*?^\}/gm, '');
    src = src.replace(/^export\s+type\s+[^;]+;\s*$/gm, '');
    src = src.replace(/\bexport\s+(const|let|var|function)\b/g, '$1');
    src = src.replace(/(const\s+\w+)\s*:\s*[^=]+=/g, '$1 =');
    src += '\nreturn CITIES_V2;';
    const fn = new Function(src);
    return fn();
}

function loadManualSeeds() {
    let src = fs.readFileSync(ROADS_TS, 'utf8');
    src = src.replace(/^\s*import\b[^;]*;\s*$/gm, '');
    src = src.replace(/^export\s+interface\s+\w+\s*\{[\s\S]*?^\}/gm, '');
    src = src.replace(/\bexport\s+(const|let|var|function)\b/g, '$1');
    src = src.replace(/(const\s+\w+)\s*:\s*[^=]+=/g, '$1 =');
    src += '\nreturn VECTOR_ROAD_DATA;';
    const fn = new Function(src);
    const data = fn();
    
    const seen = new Set();
    const manualEdges = [];
    for (const f of data.features) {
        const sc = f.properties?.startConnection;
        const ec = f.properties?.endConnection;
        if (!sc || !ec) continue;
        const key = [sc, ec].sort().join('::');
        if (seen.has(key)) continue;
        seen.add(key);
        manualEdges.push({
            fromId: sc,
            toId: ec,
            type: 'manual_seed'
        });
    }
    console.log(`      手画路原始 ${data.features.length} 条, 去重后 ${manualEdges.length} 条 unique pair`);
    return manualEdges;
}

function generateCandidates(cities) {
    const candidates = [];
    for (let i = 0; i < cities.length; i++) {
        for (let j = i + 1; j < cities.length; j++) {
            const a = cities[i], b = cities[j];
            const d = distKm(a, b);
            if (d > MAX_HOP_KM) continue;
            if (crossesWater(a, b)) continue;
            candidates.push({ a, b, dist: d });
        }
    }
    return candidates;
}

function getGridKey(lng, lat) {
    return `${Math.floor(lng / 3)},${Math.floor(lat / 3)}`;
}

function gabrielFilter(candidates, cities) {
    const grid = new Map();
    for (const c of cities) {
        const key = getGridKey(c.lng, c.lat);
        if (!grid.has(key)) grid.set(key, []);
        grid.get(key).push(c);
    }
    
    function getNearbyCities(midLng, midLat, radiusDeg) {
        const nearby = [];
        const rCells = Math.ceil(radiusDeg / 3);
        const cx = Math.floor(midLng / 3);
        const cy = Math.floor(midLat / 3);
        for (let x = cx - rCells; x <= cx + rCells; x++) {
            for (let y = cy - rCells; y <= cy + rCells; y++) {
                const arr = grid.get(`${x},${y}`);
                if (arr) nearby.push(...arr);
            }
        }
        return nearby;
    }
    
    const result = [];
    for (const { a, b, dist } of candidates) {
        const mid = { lng: (a.lng + b.lng) / 2, lat: (a.lat + b.lat) / 2 };
        const halfDist = dist / 2;
        const halfDeg = halfDist / 111 + 0.5; // margin
        const nearby = getNearbyCities(mid.lng, mid.lat, halfDeg);
        let blocked = false;
        for (const c of nearby) {
            if (c.id === a.id || c.id === b.id) continue;
            if (distKm(mid, c) < halfDist - 0.1) {
                blocked = true;
                break;
            }
        }
        if (!blocked) {
            result.push({ from: a, to: b, dist, type: 'gabriel' });
        }
    }
    return result;
}

function buildGraph(edges, cities) {
    const graph = new Map();
    for (const c of cities) graph.set(c.id, []);
    for (const e of edges) {
        graph.get(e.from.id).push(e.to.id);
        graph.get(e.to.id).push(e.from.id);
    }
    return graph;
}

function findConnectedComponents(graph, cities) {
    const visited = new Set();
    const components = [];
    for (const c of cities) {
        if (!visited.has(c.id)) {
            const comp = [];
            const q = [c.id];
            visited.add(c.id);
            while(q.length > 0) {
                const cur = q.shift();
                comp.push(cur);
                for (const n of graph.get(cur)) {
                    if (!visited.has(n)) {
                        visited.add(n);
                        q.push(n);
                    }
                }
            }
            components.push(comp);
        }
    }
    return components;
}

function main() {
    const cities = loadCities();
    const cityById = new Map(cities.map(c => [c.id, c]));
    
    console.log(`[1/7] 生成候选边...`);
    const candidates = generateCandidates(cities);
    console.log(`      候选边数: ${candidates.length}`);
    
    console.log(`[2/7] Gabriel Graph 过滤...`);
    const gabrielEdges = gabrielFilter(candidates, cities);
    console.log(`      Gabriel边数: ${gabrielEdges.length}`);
    
    console.log(`[3/7] (跳过老数据) 全面采用 Gabriel 拓扑 + PREFERRED_INNER...`);
    // const manualSeedPairs = loadManualSeeds(); // 废弃老的人工种子，彻底重置
    
    let edgesMap = new Map();
    function addEdge(aId, bId, dist, type, allowWater = false) {
        const key = [aId, bId].sort().join('-');
        if (!edgesMap.has(key) || type === 'preferred' || type === 'rescue') {
            const a = cityById.get(aId);
            const b = cityById.get(bId);
            if (a && b) {
                edgesMap.set(key, { from: a, to: b, dist, type, allowWater });
            }
        }
    }
    
    for (const e of gabrielEdges) {
        addEdge(e.from.id, e.to.id, e.dist, e.type);
    }
    
    console.log(`[4/7] 注入 PREFERRED_INNER 兜底...`);
    for (const [fromId, override] of Object.entries(PREFERRED_INNER)) {
        const a = cityById.get(fromId);
        const b = cityById.get(override.target);
        if (a && b) {
            addEdge(fromId, override.target, distKm(a, b), 'preferred', override.allowWater);
        }
    }
    
    console.log(`[5/7] 连通分量 Rescue...`);
    let graphEdges = Array.from(edgesMap.values());
    let graph = buildGraph(graphEdges, cities);
    let comps = findConnectedComponents(graph, cities);
    
    if (comps.length > 1) {
        // Find main component
        comps.sort((a, b) => b.length - a.length);
        const mainComp = new Set(comps[0]);
        console.log(`      发现孤岛！主网包含 ${mainComp.size} 节点。开始救援...`);
        for (let i = 1; i < comps.length; i++) {
            const orphanComp = comps[i];
            let bestDist = Infinity;
            let bestEdge = null;
            for (const oid of orphanComp) {
                const oc = cityById.get(oid);
                for (const mid of mainComp) {
                    const mc = cityById.get(mid);
                    const d = distKm(oc, mc);
                    if (d < bestDist && d <= 600) {
                        bestDist = d;
                        bestEdge = { a: oc, b: mc, d };
                    }
                }
            }
            if (bestEdge) {
                addEdge(bestEdge.a.id, bestEdge.b.id, bestEdge.d, 'rescue');
                console.log(`      [救援] ${bestEdge.a.name} -> ${bestEdge.b.name} (${bestEdge.d.toFixed(0)}km)`);
                // 把这个孤岛合并进主网
                for (const oid of orphanComp) mainComp.add(oid);
            } else {
                console.log(`      [失败] 无法为孤岛分量找到 <=600km 的救援边: ${orphanComp.join(',')}`);
            }
        }
    } else {
        console.log(`      所有据点连通，无需救援。`);
    }
    
    console.log(`[6/7] 标注边类型并统计...`);
    graphEdges = Array.from(edgesMap.values());
    const finalEdges = graphEdges.map(e => ({
        ...e,
        sameRegion: getCityRegion(e.from) === getCityRegion(e.to)
    }));
    
    let counts = { gabriel: 0, manual_seed: 0, preferred: 0, rescue: 0 };
    for (const e of finalEdges) counts[e.type]++;
    
    const dists = finalEdges.map(e => e.dist).sort((a,b) => a-b);
    const p50 = dists[Math.floor(dists.length * 0.5)];
    const p90 = dists[Math.floor(dists.length * 0.9)];
    const p99 = dists[Math.floor(dists.length * 0.99)];
    
    console.log(`\n=== 最终网络报告 ===`);
    console.log(`  总边数: ${finalEdges.length}`);
    console.log(`  Gabriel: ${counts.gabriel}`);
    console.log(`  Preferred: ${counts.preferred}`);
    console.log(`  Rescue: ${counts.rescue}`);
    console.log(`  P50: ${p50?.toFixed(0)}km | P90: ${p90?.toFixed(0)}km | P99: ${p99?.toFixed(0)}km | Max: ${dists[dists.length-1]?.toFixed(0)}km`);
    
    console.log(`[7/7] 输出 ${OUTPUT_GEOJSON}...`);
    const features = finalEdges.map(c => {
        let color = '#9C27B0'; // 紫色区内
        if (!c.sameRegion) color = '#F44336'; // 红色跨区
        if (c.type === 'manual_seed') color = '#FF9800'; // 橙色手画
        if (c.type === 'preferred' || c.type === 'rescue') color = '#2196F3'; // 蓝色特例
        
        return {
            type: 'Feature',
            properties: {
                source: c.type,
                from: c.from.id,
                fromName: c.from.name,
                to: c.to.id,
                toName: c.to.name,
                length_km: Math.round(c.dist * 10) / 10,
                color: color,
                allowWater: !!c.allowWater
            },
            geometry: {
                type: 'LineString',
                coordinates: [[c.from.lng, c.from.lat], [c.to.lng, c.to.lat]]
            }
        };
    });
    
    const fc = {
        type: 'FeatureCollection',
        meta: {
            generated: new Date().toISOString(),
            edgeCount: features.length,
            cityCount: cities.length,
        },
        features
    };
    fs.writeFileSync(OUTPUT_GEOJSON, JSON.stringify(fc, null, 2));
    console.log(`✅ 成功输出 (${(fs.statSync(OUTPUT_GEOJSON).size / 1024).toFixed(0)} KB)`);
}

main();
