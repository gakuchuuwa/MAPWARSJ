const fs = require('fs');

const citiesContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const regionsContent = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

const regionsMatch = regionsContent.match(/const REGIONS[\s\S]*?\];/);
let REGIONS = [];
if (regionsMatch) {
    const code = regionsMatch[0].replace('const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] =', 'REGIONS =');
    eval(code);
}

function getRegionForPoint(lat, lng) {
    for (const region of REGIONS) {
        const poly = region.polygon;
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i].lat, yi = poly[i].lng;
            const xj = poly[j].lat, yj = poly[j].lng;
            if (lat === xi && lng === yi) return region.id;
            const intersect = ((yi > lng) !== (yj > lng)) && (lat < (xj - xi) * (lng - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        if (inside) return region.id;
    }
    return 'CENTRAL'; 
}

const cityRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'[^}]*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)[^}]*}/g;
const cities = [];
let match;
while ((match = cityRegex.exec(citiesContent)) !== null) {
    cities.push({
        id: match[1],
        name: match[2],
        lat: parseFloat(match[3]),
        lng: parseFloat(match[4]),
        explicitRegion: match[0].match(/region:\s*'([^']+)'/) ? match[0].match(/region:\s*'([^']+)'/)[1] : null
    });
}

const counts = {};
for (const r of REGIONS) counts[r.id] = 0;
counts['CENTRAL'] = 0; // Initialize fallback just in case

for (const city of cities) {
    let r = city.explicitRegion || getRegionForPoint(city.lat, city.lng);
    if (!counts[r]) counts[r] = 0;
    counts[r]++;
}

const regionNames = {
    'CENTRAL': '中原 (CENTRAL)',
    'NORTH': '北方 (NORTH)',
    'NORTHEAST': '东北 (NORTHEAST)',
    'KOREA': '朝鲜 (KOREA)',
    'JAPAN': '日本 (JAPAN)',
    'WESTERN': '西域 (WESTERN)',
    'HEXI': '河西 (HEXI)',
    'STEPPE': '草原 (STEPPE)',
    'BASHU': '川蜀 (BASHU)',
    'JIANGNAN': '南方 (JIANGNAN)',
    'LINGNAN': '岭南 (LINGNAN)',
    'DIANQIAN': '滇缅 (DIANQIAN)',
    'TIBET': '青藏 (TIBET)',
    'CENTRAL_ASIA': '中亚 (CENTRAL_ASIA)',
    'TROPICS': '热带 (TROPICS)' // fallback check
};

console.log("=== 14区据点数量统计 ===");
const sortedRegions = Object.entries(counts).sort((a,b) => b[1] - a[1]);
let total = 0;
for (const [r, c] of sortedRegions) {
    if (c === 0 && !regionNames[r]) continue;
    const name = regionNames[r] || r;
    console.log(`${name.padEnd(20, ' ')} | ${c} 座`);
    total += c;
}
console.log(`---------------------------------`);
console.log(`总计:                 | ${total} 座`);
