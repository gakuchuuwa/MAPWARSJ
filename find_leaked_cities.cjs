const fs = require('fs');

const citiesContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const regionsContent = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');

const regionsMatch = regionsContent.match(/const REGIONS[\s\S]*?\];/);
let REGIONS = [];
if (regionsMatch) {
    const code = regionsMatch[0].replace('const REGIONS: { id: RegionType; polygon: {lat:number,lng:number}[] }[] =', 'REGIONS =');
    eval(code);
}

function getExactRegionForPoint(lat, lng) {
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
    return null; // Return null if it misses ALL polygons!
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

const leakedCities = [];
let explicitCount = 0;
let polygonCount = 0;

for (const city of cities) {
    if (city.explicitRegion) {
        explicitCount++;
        continue;
    }
    
    const matchedRegion = getExactRegionForPoint(city.lat, city.lng);
    if (matchedRegion) {
        polygonCount++;
    } else {
        leakedCities.push(city);
    }
}

console.log(`Total explicit overrides: ${explicitCount}`);
console.log(`Successfully matched by polygons: ${polygonCount}`);
console.log(`\n--- Leaked / Untagged Cities (Outside ALL polygons) ---`);
console.log(`Count: ${leakedCities.length}`);
for (const city of leakedCities) {
    console.log(`${city.name.padEnd(10, ' ')} | lat: ${city.lat}, lng: ${city.lng}`);
}
