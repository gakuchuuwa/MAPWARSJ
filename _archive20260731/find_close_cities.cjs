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
        tier: match[6] ? parseInt(match[6]) : 99 // 99 means no tier specified
    });
}

const THRESHOLD_KM = 50;
let conflicts = [];

for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const c1 = cities[i];
        const c2 = cities[j];
        const dist = getDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
        
        if (dist < THRESHOLD_KM) {
            conflicts.push({
                c1,
                c2,
                dist
            });
        }
    }
}

conflicts.sort((a, b) => a.dist - b.dist);

let report = `# 城市距离过近检测报告 (小于 ${THRESHOLD_KM}km)\n\n`;
report += `总共发现 ${conflicts.length} 对冲突。\n\n`;

for (const c of conflicts) {
    report += `- 🚨 距离 **${c.dist.toFixed(1)}km** : [T${c.c1.tier}] **${c.c1.name}** (${c.c1.id}) vs [T${c.c2.tier}] **${c.c2.name}** (${c.c2.id})\n`;
}

fs.writeFileSync('city_distance_report.md', report);
console.log('Report saved to city_distance_report.md. Total conflicts: ' + conflicts.length);
