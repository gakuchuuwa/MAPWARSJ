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

// 1. Calculate distance to Luoyang for every city
for (let c of cities) {
    c.distToLuoyang = getDistanceKm(c.lat, c.lng, luoyang.lat, luoyang.lng);
}

const THRESHOLD_KM = 250;
let disconnectedCities = [];

// 2. Check local rule: exists B such that dist(A, B) <= 250 AND dist(B, Luoyang) < dist(A, Luoyang)
for (let A of cities) {
    if (A.id === LUOYANG_ID) continue;
    
    let hasValidParent = false;
    let closestValidParent = null;
    let closestValidParentDist = Infinity;
    
    // For reporting purposes, let's also find the "closest" city that is closer to Luoyang, 
    // even if it's > 250km, just so we know what the gap is.
    let bestAttempt = null;
    let bestAttemptDist = Infinity;
    
    for (let B of cities) {
        if (A.id === B.id) continue;
        
        // B must be closer to Luoyang than A
        if (B.distToLuoyang < A.distToLuoyang) {
            const distAB = getDistanceKm(A.lat, A.lng, B.lat, B.lng);
            
            if (distAB <= THRESHOLD_KM) {
                hasValidParent = true;
                if (distAB < closestValidParentDist) {
                    closestValidParentDist = distAB;
                    closestValidParent = B;
                }
            }
            
            if (distAB < bestAttemptDist) {
                bestAttemptDist = distAB;
                bestAttempt = B;
            }
        }
    }
    
    if (!hasValidParent) {
        disconnectedCities.push({
            city: A,
            bestAttempt: bestAttempt,
            bestAttemptDist: bestAttemptDist
        });
    }
}

// Sort by distance to Luoyang (furthest first, so we see the edges of the network)
disconnectedCities.sort((a, b) => b.city.distToLuoyang - a.city.distToLuoyang);

let report = `# 洛阳辐射网断链据点报告 (最大间距 ${THRESHOLD_KM}km)\n\n`;
report += `总共发现 ${disconnectedCities.length} 个据点无法在朝向洛阳的方向上找到 ${THRESHOLD_KM}km 内的接力点。\n\n`;

for (const item of disconnectedCities) {
    report += `- **${item.city.name}** (${item.city.id})\n`;
    report += `  - 距洛阳: ${item.city.distToLuoyang.toFixed(1)} km\n`;
    if (item.bestAttempt) {
        report += `  - 朝向洛阳的最近据点是: **${item.bestAttempt.name}** (${item.bestAttempt.id})\n`;
        report += `  - 但间距达 **${item.bestAttemptDist.toFixed(1)} km** (超过了250km的标准)\n`;
    } else {
        report += `  - 异常: 找不到任何比它离洛阳更近的据点\n`;
    }
    report += `\n`;
}

fs.writeFileSync('luoyang_network_report.md', report);
console.log(`Report saved. Disconnected cities: ${disconnectedCities.length}`);
