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

const ISOLATED_THRESHOLD_KM = 300;
let isolatedCitiesWithNearest = [];

for (let i = 0; i < cities.length; i++) {
    const c1 = cities[i];
    let hasCloseCity = false;
    let minDistance = Infinity;
    let nearestCity = null;
    
    for (let j = 0; j < cities.length; j++) {
        if (i === j) continue;
        
        const c2 = cities[j];
        const dist = getDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
        
        if (dist <= ISOLATED_THRESHOLD_KM) {
            hasCloseCity = true;
            break; // We only need to know if it's NOT isolated for the first pass
        }
    }
    
    // If it is isolated, find the nearest city and its distance
    if (!hasCloseCity) {
        for (let j = 0; j < cities.length; j++) {
            if (i === j) continue;
            
            const c2 = cities[j];
            const dist = getDistanceKm(c1.lat, c1.lng, c2.lat, c2.lng);
            
            if (dist < minDistance) {
                minDistance = dist;
                nearestCity = c2;
            }
        }
        
        isolatedCitiesWithNearest.push({
            city: c1,
            nearestCity: nearestCity,
            distance: minDistance
        });
    }
}

let report = `# 孤立据点及最近邻近据点报告 (方圆 ${ISOLATED_THRESHOLD_KM}km 内无其他据点)\n\n`;
report += `总共发现 ${isolatedCitiesWithNearest.length} 个孤立据点。\n\n`;

for (const c of isolatedCitiesWithNearest) {
    report += `- **${c.city.name}** (${c.city.id})\n`;
    report += `  - 最接近据点: **${c.nearestCity.name}** (${c.nearestCity.id})\n`;
    report += `  - 直线距离: **${c.distance.toFixed(1)} km**\n\n`;
}

fs.writeFileSync('isolated_cities_report.md', report);
console.log('Report saved to isolated_cities_report.md. Total isolated: ' + isolatedCitiesWithNearest.length);
