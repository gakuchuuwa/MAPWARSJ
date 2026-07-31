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

const MIN_THRESHOLD_KM = 50;
const MAX_ISOLATED_THRESHOLD_KM = 250;

let closeConflicts = [];
let isolatedCitiesWithNearest = [];

for (let i = 0; i < cities.length; i++) {
    const c1 = cities[i];
    let minDistance = Infinity;
    let nearestCity = null;
    
    for (let j = 0; j < cities.length; j++) {
        if (i === j) continue;
        
        const c2 = cities[j];
        const dist = getDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
        
        // Check for < 50km
        // To avoid duplicates, only record when i < j
        if (dist < MIN_THRESHOLD_KM && i < j) {
            closeConflicts.push({ c1, c2, dist });
        }
        
        // Keep track of nearest city for isolation check
        if (dist < minDistance) {
            minDistance = dist;
            nearestCity = c2;
        }
    }
    
    // Check for > 250km (meaning its nearest city is > 250km away)
    if (minDistance > MAX_ISOLATED_THRESHOLD_KM) {
        isolatedCitiesWithNearest.push({
            city: c1,
            nearestCity: nearestCity,
            distance: minDistance
        });
    }
}

closeConflicts.sort((a, b) => a.dist - b.dist);
isolatedCitiesWithNearest.sort((a, b) => b.distance - a.distance);

let report = `# 综合据点距离检测报告\n\n`;
report += `## 一、 距离过近据点 (小于 ${MIN_THRESHOLD_KM}km)\n`;
report += `总共发现 ${closeConflicts.length} 对冲突。\n\n`;

for (const c of closeConflicts) {
    report += `- 🚨 距离 **${c.dist.toFixed(1)}km** : [T${c.c1.tier}] **${c.c1.name}** (${c.c1.id}) vs [T${c.c2.tier}] **${c.c2.name}** (${c.c2.id})\n`;
}

report += `\n## 二、 孤立据点 (方圆 ${MAX_ISOLATED_THRESHOLD_KM}km 内无其他据点)\n`;
report += `总共发现 ${isolatedCitiesWithNearest.length} 个孤立据点。\n\n`;

for (const c of isolatedCitiesWithNearest) {
    report += `- 🏝️ **${c.city.name}** (${c.city.id})\n`;
    if (c.nearestCity) {
        report += `  - 最接近据点: **${c.nearestCity.name}** (${c.nearestCity.id})\n`;
        report += `  - 直线距离: **${c.distance.toFixed(1)} km**\n`;
    }
}

fs.writeFileSync('distance_check_report.md', report);
console.log(`Report saved. Close pairs: ${closeConflicts.length}, Isolated: ${isolatedCitiesWithNearest.length}`);
