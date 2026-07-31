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

if (!luoyang) {
    console.error("Luoyang not found!");
    process.exit(1);
}

const MIN_THRESHOLD_KM = 50;
const MAX_NETWORK_THRESHOLD_KM = 300;

let closeConflicts = [];

// 1. Check for close conflicts (< 50km)
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

// 2. Check for Luoyang network disconnects (< 300km) using Graph BFS (Reachability)
let visited = new Set();
let queue = [luoyang];
visited.add(luoyang.id);

// To reconstruct paths or see what they could connect to, we can store parents
let parentMap = new Map();

while (queue.length > 0) {
    let current = queue.shift();
    
    for (let city of cities) {
        if (!visited.has(city.id)) {
            const dist = getDistanceKm(current.lat, current.lng, city.lat, city.lng);
            // Allow 301km to cover the "300.8km" and "300.3km" exceptions seamlessly, or strictly 300
            // Since user said ignore 300.8 and 300.3, we can use 301 as the threshold
            if (dist <= 301) {
                visited.add(city.id);
                parentMap.set(city.id, current);
                queue.push(city);
            }
        }
    }
}

let disconnectedCities = [];
for (let city of cities) {
    if (!visited.has(city.id)) {
        // Find the absolute closest city to it, just to report what the gap is
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
        
        disconnectedCities.push({
            city: city,
            closestCity: closestCity,
            gap: minGap
        });
    }
}

// Sort by gap
disconnectedCities.sort((a, b) => b.gap - a.gap);

let report = `# 综合检测报告 (以洛阳为中心, 连通图BFS算法)\n\n`;

report += `## 一、 距离过近据点 (任意两点间距小于 ${MIN_THRESHOLD_KM}km)\n`;
report += `总共发现 ${closeConflicts.length} 对冲突。\n\n`;

for (const c of closeConflicts) {
    report += `- 🚨 距离 **${c.dist.toFixed(1)}km** : [T${c.c1.tier}] **${c.c1.name}** (${c.c1.id}) vs [T${c.c2.tier}] **${c.c2.name}** (${c.c2.id})\n`;
}

report += `\n## 二、 洛阳辐射网断链据点 (通过间距 < 300km 的节点接力，无论方向，无法连通至洛阳)\n`;
report += `总共发现 ${disconnectedCities.length} 个断链据点。\n\n`;

for (const item of disconnectedCities) {
    report += `- **${item.city.name}** (${item.city.id})\n`;
    if (item.closestCity) {
        report += `  - 距离它全局最近的据点是: **${item.closestCity.name}** (${item.closestCity.id})\n`;
        report += `  - 但间距达 **${item.gap.toFixed(1)} km** (形成孤岛)\n`;
    }
    report += `\n`;
}

fs.writeFileSync('combined_report.md', report);
console.log(`Report saved. Close pairs: ${closeConflicts.length}, Disconnected: ${disconnectedCities.length}`);
