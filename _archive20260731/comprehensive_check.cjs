const fs = require('fs');

function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
}

const citiesSrc = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'([^']+)',\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+).*?(?:tier:\s*([0-9]+))?/gs;

let cities = [];
let match;
while ((match = cityRegex.exec(citiesSrc)) !== null) {
    cities.push({
        id: match[1],
        name: match[2],
        factionId: match[3],
        lat: parseFloat(match[4]),
        lng: parseFloat(match[5]),
        tier: match[6] ? parseInt(match[6]) : 99 
    });
}

const LUOYANG_ID = 'city_luoyang';
let luoyang = cities.find(c => c.id === LUOYANG_ID);

let report = `# 据点数据全面体检报告\n\n`;
report += `**总据点数量**: ${cities.length} 个\n\n`;

// 1. Check for Duplicate IDs
let idCounts = {};
let duplicates = [];
for (let c of cities) {
    idCounts[c.id] = (idCounts[c.id] || 0) + 1;
    if (idCounts[c.id] === 2) {
        duplicates.push(c.id);
    }
}
report += `## 一、 ID 唯一性检测\n`;
if (duplicates.length === 0) {
    report += `✅ 通过：没有发现重复的据点 ID。\n`;
} else {
    report += `❌ 失败：发现以下重复 ID：\n`;
    for (let d of duplicates) {
        report += `- ${d}\n`;
    }
}
report += `\n`;

// 2. Check for Invalid Coordinates
let invalidCoords = [];
for (let c of cities) {
    if (isNaN(c.lat) || isNaN(c.lng) || c.lat < -90 || c.lat > 90 || c.lng < -180 || c.lng > 180) {
        invalidCoords.push(c);
    }
}
report += `## 二、 坐标合法性检测\n`;
if (invalidCoords.length === 0) {
    report += `✅ 通过：所有据点坐标均在合理范围内 (-90~90, -180~180)。\n`;
} else {
    report += `❌ 失败：发现以下据点坐标异常：\n`;
    for (let c of invalidCoords) {
        report += `- ${c.name} (${c.id}): lat=${c.lat}, lng=${c.lng}\n`;
    }
}
report += `\n`;

// 3. Check Minimum Distance (> 50km)
const MIN_THRESHOLD_KM = 50;
let closeConflicts = [];
for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const c1 = cities[i];
        const c2 = cities[j];
        const dist = getDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
        if (dist < MIN_THRESHOLD_KM) {
            closeConflicts.push({ c1, c2, dist });
        }
    }
}
closeConflicts.sort((a, b) => a.dist - b.dist);

report += `## 三、 拥挤度检测 (两点间距 < 50km)\n`;
if (closeConflicts.length === 0) {
    report += `✅ 通过：没有发现距离小于 50km 的据点。\n`;
} else {
    report += `❌ 失败：发现 ${closeConflicts.length} 对据点距离过近：\n`;
    for (const c of closeConflicts) {
        report += `- 距离 ${c.dist.toFixed(1)}km : ${c.c1.name} vs ${c.c2.name}\n`;
    }
}
report += `\n`;

// 4. Check Global Connectivity to Luoyang (Max step 301km)
report += `## 四、 洛阳向心网络连通性检测 (连通步长阈值 301km)\n`;
if (!luoyang) {
    report += `❌ 失败：未找到洛阳 (${LUOYANG_ID})。\n`;
} else {
    let visited = new Set();
    let queue = [luoyang];
    visited.add(luoyang.id);

    while (queue.length > 0) {
        let current = queue.shift();
        for (let city of cities) {
            if (!visited.has(city.id)) {
                const dist = getDistanceKm(current.lat, current.lng, city.lat, city.lng);
                if (dist <= 301) {
                    visited.add(city.id);
                    queue.push(city);
                }
            }
        }
    }

    let disconnectedCities = [];
    for (let city of cities) {
        if (!visited.has(city.id)) {
            let minGap = Infinity;
            let closestCity = null;
            for (let other of cities) {
                if (other.id === city.id) continue;
                const dist = getDistanceKm(city.lat, city.lng, other.lat, other.lng);
                if (dist < minGap) {
                    minGap = dist;
                    closestCity = other;
                }
            }
            disconnectedCities.push({ city, closestCity, gap: minGap });
        }
    }
    disconnectedCities.sort((a, b) => b.gap - a.gap);

    if (disconnectedCities.length === 0) {
        report += `✅ 通过：所有 ${cities.length} 个据点均可通过接力连通至洛阳。\n`;
    } else {
        report += `❌ 失败：发现 ${disconnectedCities.length} 个断链孤岛：\n`;
        for (const item of disconnectedCities) {
            report += `- ${item.city.name} (${item.city.id})，距全局最近据点 ${item.gap.toFixed(1)} km\n`;
        }
    }
}

fs.writeFileSync('comprehensive_report.md', report);
console.log('Comprehensive check complete.');
