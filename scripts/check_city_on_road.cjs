// @ts-nocheck
const fs = require('fs');
const c = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const r = fs.readFileSync('src/data/VectorRoadData.ts', 'utf8');

// ============================================================
// 1. 解析所有城市数据（兼容单行和多行格式）
// ============================================================
const cities = {};
// 匹配 { id: 'xxx', name: 'xxx', factionId: 'xxx', lat: N, lng: N, ... }
// 使用 [\s\S]*? 跨行非贪婪匹配各字段
const cityRe = /id:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?factionId:\s*'([^']+)'[\s\S]*?lat:\s*([\d.-]+)[\s\S]*?lng:\s*([\d.-]+)/g;
let m;
while ((m = cityRe.exec(c)) !== null) {
  cities[m[1]] = {
    name: m[2],
    faction: m[3],
    lat: parseFloat(m[4]),
    lng: parseFloat(m[5])
  };
}

console.log(`总计城市: ${Object.keys(cities).length}`);

// ============================================================
// 2. 解析道路数据
// ============================================================
const roadBlocks = r.split(/\btype:\s*"Feature"/);
let startMismatch = 0;
let endMismatch = 0;
let totalRoadsWithConns = 0;
let totalMismatchKm = 0;
let maxMismatch = { roadName: '', cityName: '', km: 0 };
let mismatchDetails = [];

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

for (let i = 1; i < roadBlocks.length; i++) {
  const block = roadBlocks[i];
  const startMatch = block.match(/startConnection:\s*"([^"]+)"/);
  const endMatch = block.match(/endConnection:\s*"([^"]+)"/);
  const nameMatch = block.match(/name:\s*"([^"]+)"/);
  const name = nameMatch ? nameMatch[1] : `road_${i}`;

  if (!startMatch && !endMatch) continue;
  totalRoadsWithConns++;

  // Extract first and last coordinate from LineString
  const coordMatch = block.match(/coordinates:\s*\[([\s\S]*?)\]\s*\}/);
  if (!coordMatch) continue;

  const coordStr = coordMatch[1];
  const pointMatches = [...coordStr.matchAll(/\[([\d.-]+),\s*([\d.-]+)\]/g)];
  if (pointMatches.length < 2) continue;

  const firstLng = parseFloat(pointMatches[0][1]);
  const firstLat = parseFloat(pointMatches[0][2]);
  const lastLng = parseFloat(pointMatches[pointMatches.length - 1][1]);
  const lastLat = parseFloat(pointMatches[pointMatches.length - 1][2]);

  if (startMatch) {
    const city = cities[startMatch[1]];
    if (city) {
      const d = haversine(city.lat, city.lng, firstLat, firstLng);
      if (d > 1) { // > 1km mismatch
        startMismatch++;
        totalMismatchKm += d;
        if (d > maxMismatch.km) maxMismatch = { roadName: name, cityName: city.name, km: d };
        mismatchDetails.push({
          type: '起点', road: name, cityId: startMatch[1], cityName: city.name,
          cityLat: city.lat, cityLng: city.lng,
          roadLat: firstLat, roadLng: firstLng, km: d
        });
        console.log(`  ⚠️ 起点 ${name}: "${city.name}" (${city.lat.toFixed(4)},${city.lng.toFixed(4)}) ≠ 路端 (${firstLat.toFixed(4)},${firstLng.toFixed(4)}) 偏差${d.toFixed(1)}km`);
      } else if (d > 0.01) {
        console.log(`  ✓ 起点 ${name}: "${city.name}" 偏差${d.toFixed(2)}km (可接受)`);
      }
    }
  }

  if (endMatch) {
    const city = cities[endMatch[1]];
    if (city) {
      const d = haversine(city.lat, city.lng, lastLat, lastLng);
      if (d > 1) {
        endMismatch++;
        totalMismatchKm += d;
        if (d > maxMismatch.km) maxMismatch = { roadName: name, cityName: city.name, km: d };
        mismatchDetails.push({
          type: '终点', road: name, cityId: endMatch[1], cityName: city.name,
          cityLat: city.lat, cityLng: city.lng,
          roadLat: lastLat, roadLng: lastLng, km: d
        });
        console.log(`  ⚠️ 终点 ${name}: "${city.name}" (${city.lat.toFixed(4)},${city.lng.toFixed(4)}) ≠ 路端 (${lastLat.toFixed(4)},${lastLng.toFixed(4)}) 偏差${d.toFixed(1)}km`);
      } else if (d > 0.01) {
        console.log(`  ✓ 终点 ${name}: "${city.name}" 偏差${d.toFixed(2)}km (可接受)`);
      }
    }
  }
}

console.log(`\n======= 端点偏差分析结果 =======`);
console.log(`有连接的道路: ${totalRoadsWithConns}`);
console.log(`起点偏差>1km: ${startMismatch} 条`);
console.log(`终点偏差>1km: ${endMismatch} 条`);
console.log(`总偏差里程: ${totalMismatchKm.toFixed(0)}km`);
console.log(`最大偏差: "${maxMismatch.roadName}"(${maxMismatch.cityName}) ${maxMismatch.km.toFixed(1)}km`);

// ============================================================
// 3. 检查无路城市到最近道路的距离
// ============================================================
console.log(`\n======= 无路城市到最近道路距离 =======`);
const orphanIds = [];
for (const [id, _] of Object.entries(cities)) {
  let hasRoad = false;
  for (let i = 1; i < roadBlocks.length; i++) {
    const block = roadBlocks[i];
    if (block.includes(`startConnection: "${id}"`) || block.includes(`endConnection: "${id}"`)) {
      hasRoad = true;
      break;
    }
  }
  if (!hasRoad) orphanIds.push(id);
}

console.log(`无路城市: ${orphanIds.length} 个\n`);

const orphanDistances = [];
for (const id of orphanIds) {
  const city = cities[id];
  if (!city) continue;
  let minDist = Infinity;
  let nearestRoad = '';

  for (let i = 1; i < roadBlocks.length; i++) {
    const block = roadBlocks[i];
    const nameMatch = block.match(/name:\s*"([^"]+)"/);
    const rname = nameMatch ? nameMatch[1] : `road_${i}`;

    const coordMatch = block.match(/coordinates:\s*\[([\s\S]*?)\]\s*\}/);
    if (!coordMatch) continue;

    const pointMatches = [...coordMatch[1].matchAll(/\[([\d.-]+),\s*([\d.-]+)\]/g)];
    for (const p of pointMatches) {
      const lng = parseFloat(p[1]), lat = parseFloat(p[2]);
      const d = Math.sqrt((city.lat - lat)**2 + (city.lng - lng)**2) * 111;
      if (d < minDist) {
        minDist = d;
        nearestRoad = rname;
      }
    }
  }

  orphanDistances.push({ id, name: city.name, lat: city.lat, lng: city.lng, faction: city.faction, minDist, nearestRoad });
  console.log(`  ${city.name} (${city.lat.toFixed(2)},${city.lng.toFixed(2)}) [${city.faction}] → 最近道路 "${nearestRoad}" ${minDist.toFixed(1)}km`);
}

// 按距离排序
orphanDistances.sort((a, b) => a.minDist - b.minDist);

console.log(`\n======= 无路城市按距离排序（近→远） =======`);
for (const o of orphanDistances) {
  console.log(`  ${o.name} ${o.minDist.toFixed(1)}km → "${o.nearestRoad}"`);
}

// ============================================================
// 4. 建议方案：城市坐标对齐到道路端点
// ============================================================
console.log(`\n======= 建议方案分析 =======`);

// 4a. 对于偏差 >1km 的端点，可以调整城市坐标到道路端点
if (mismatchDetails.length > 0) {
  console.log(`\n方案A: 将 ${mismatchDetails.length} 个城市的坐标移动到对应道路端点`);
  console.log(`      影响 ${new Set(mismatchDetails.map(d => d.cityId)).size} 个城市`);
  console.log(`      平均移动距离 ${(mismatchDetails.reduce((s, d) => s + d.km, 0) / mismatchDetails.length).toFixed(1)}km`);
  console.log(`      最大移动距离 ${Math.max(...mismatchDetails.map(d => d.km)).toFixed(1)}km`);
}

// 4b. 对于无路城市，可以创建新道路
const closeOrphans = orphanDistances.filter(o => o.minDist < 50);
const farOrphans = orphanDistances.filter(o => o.minDist >= 50);
console.log(`\n方案B: 无路城市分析`);
console.log(`      距离最近道路 <50km: ${closeOrphans.length} 个（可微调坐标到道路上）`);
console.log(`      距离最近道路 >=50km: ${farOrphans.length} 个（需要新建道路）`);

if (closeOrphans.length > 0) {
  console.log(`\n      可微调坐标的无路城市（<50km）:`);
  for (const o of closeOrphans) {
    console.log(`        ${o.name} (${o.minDist.toFixed(1)}km from "${o.nearestRoad}")`);
  }
}

if (farOrphans.length > 0) {
  console.log(`\n      需新建道路的无路城市（>=50km）:`);
  for (const o of farOrphans) {
    console.log(`        ${o.name} (${o.minDist.toFixed(1)}km from "${o.nearestRoad}")`);
  }
}
