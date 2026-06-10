import * as fs from 'fs';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');
const cityRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*factionId:\s*['"]([^'"]+)['"],\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+).*?\}/gs;

const cities: any[] = [];
let match;
while ((match = cityRegex.exec(content)) !== null) {
    cities.push({ 
        id: match[1], 
        name: match[2], 
        factionId: match[3],
        lat: parseFloat(match[4]), 
        lng: parseFloat(match[5]) 
    });
}

const conflicts: any[] = [];
for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const d = calculateDistance(cities[i].lat, cities[i].lng, cities[j].lat, cities[j].lng);
        if (d < 50) {
            conflicts.push({
                c1: cities[i],
                c2: cities[j],
                dist: d
            });
        }
    }
}

conflicts.sort((a, b) => a.dist - b.dist);

if (conflicts.length === 0) {
    console.log('SUCCESS: No cities are within 50km of each other. Total cities: ' + cities.length);
} else {
    console.log('WARNING: Found ' + conflicts.length + ' conflicts:');
    for (const c of conflicts) {
        console.log(`${c.c1.name} (${c.c1.factionId}) vs ${c.c2.name} (${c.c2.factionId}): ${c.dist.toFixed(2)} km`);
    }
}