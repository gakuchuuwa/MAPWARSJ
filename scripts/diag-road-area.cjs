#!/usr/bin/env node
/**
 * diag-road-area.cjs — 诊断指定坐标附近的道路数据是否真有连接
 * 用法: node scripts/diag-road-area.cjs <lng1> <lat1> <lng2> <lat2> [dataFile]
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const [lng1, lat1, lng2, lat2] = args.slice(0, 4).map(Number);
const dataFile = args[4] || 'roads_filtered.geojson';
const RADIUS_KM = 30;

const geojsonPath = path.join(__dirname, '..', 'public', 'assets', dataFile);
const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
console.log(`Data: ${dataFile} (${data.features.length} features)`);

function haversine(lng1, lat1, lng2, lat2) {
    const R = 6371, toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2;
    return R * 2 * Math.asin(Math.sqrt(a));
}

function nearestPointDist(coord, refLng, refLat) {
    let best = Infinity;
    for (const c of coord) {
        const d = haversine(c[0], c[1], refLng, refLat);
        if (d < best) best = d;
    }
    return best;
}

// 找出每个点附近的道路 features
const near1 = [], near2 = [];
for (let i = 0; i < data.features.length; i++) {
    const f = data.features[i];
    const c = f.geometry?.coordinates;
    if (!c || c.length < 2) continue;
    const exp = (f.properties||{}).expressway;
    if (exp === 1) continue;  // 排除高速
    const d1 = nearestPointDist(c, lng1, lat1);
    const d2 = nearestPointDist(c, lng2, lat2);
    if (d1 < RADIUS_KM) near1.push({i, d: d1, coords: c, ends: [c[0], c[c.length-1]]});
    if (d2 < RADIUS_KM) near2.push({i, d: d2, coords: c, ends: [c[0], c[c.length-1]]});
}

console.log(`\nPoint 1 (${lng1},${lat1}): ${near1.length} road features within ${RADIUS_KM}km`);
console.log(`Point 2 (${lng2},${lat2}): ${near2.length} road features within ${RADIUS_KM}km`);

console.log(`\nDirect distance: ${haversine(lng1,lat1,lng2,lat2).toFixed(1)} km`);

// 列出 point1 附近的路, 显示其端点和长度
console.log(`\n附近 point 1 (前 10 条, 按距离排序):`);
near1.sort((a,b)=>a.d-b.d).slice(0,10).forEach(f => {
    const len = f.coords.length;
    const start = f.ends[0], end = f.ends[1];
    console.log(`  d=${f.d.toFixed(1)}km, ${len}点, start=[${start[0].toFixed(3)},${start[1].toFixed(3)}], end=[${end[0].toFixed(3)},${end[1].toFixed(3)}]`);
});

console.log(`\n附近 point 2 (前 10 条):`);
near2.sort((a,b)=>a.d-b.d).slice(0,10).forEach(f => {
    const len = f.coords.length;
    const start = f.ends[0], end = f.ends[1];
    console.log(`  d=${f.d.toFixed(1)}km, ${len}点, start=[${start[0].toFixed(3)},${start[1].toFixed(3)}], end=[${end[0].toFixed(3)},${end[1].toFixed(3)}]`);
});

// 检查两个点的"邻近 features 集合"是否有 feature 重叠 (两点都靠近同一条路)
const ids1 = new Set(near1.map(f=>f.i));
const ids2 = new Set(near2.map(f=>f.i));
const shared = [...ids1].filter(i=>ids2.has(i));
console.log(`\n两组共享 ${shared.length} 条路 (即同时靠近两点)`);

// 检查中间区域是否有道路桥接 (取两点的中点, 看 30km 内有路吗)
const midLng = (lng1+lng2)/2, midLat = (lat1+lat2)/2;
let midCount = 0;
for (const f of data.features) {
    const c = f.geometry?.coordinates;
    if (!c) continue;
    if ((f.properties||{}).expressway === 1) continue;
    if (nearestPointDist(c, midLng, midLat) < RADIUS_KM) midCount++;
}
console.log(`两点中点 (${midLng.toFixed(2)},${midLat.toFixed(2)}) ${RADIUS_KM}km 内: ${midCount} 条路`);
