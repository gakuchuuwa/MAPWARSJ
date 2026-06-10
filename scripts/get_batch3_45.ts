import * as fs from 'fs';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const citiesContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const factionsContent = fs.readFileSync('./src/data/factions.ts', 'utf-8');

const factionNameMap: Record<string, string> = {};
const factionRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/g;
let fMatch;
while ((fMatch = factionRegex.exec(factionsContent)) !== null) {
    factionNameMap[fMatch[1]] = fMatch[2];
}
factionNameMap['none'] = '无势力';

const cities: any[] = [];
const cityRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*factionId:\s*['"]([^'"]+)['"],\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+).*?tier:\s*(\d).*?\}/gs;

let match;
while ((match = cityRegex.exec(citiesContent)) !== null) {
    const factionId = match[3];
    cities.push({
        id: match[1],
        name: match[2],
        factionId: factionId,
        factionName: factionNameMap[factionId] || factionId,
        lat: parseFloat(match[4]),
        lng: parseFloat(match[5]),
        tier: parseInt(match[6])
    });
}

function isGeneric(factionId: string) {
    return factionId === 'panjun' || factionId === 'none' || !factionId;
}

const batch3_45: any[] = [];

for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const dist = calculateDistance(cities[i].lat, cities[i].lng, cities[j].lat, cities[j].lng);
        if (dist < 50 && dist >= 45) {
            const g1 = isGeneric(cities[i].factionId);
            const g2 = isGeneric(cities[j].factionId);
            if (!g1 && !g2) {
                batch3_45.push({
                    city1: cities[i],
                    city2: cities[j],
                    distance: dist
                });
            }
        }
    }
}

let markdown = '| 据点 1 | 据点 2 | 距离 (KM) | 势力 1 | 势力 2 |\n| --- | --- | --- | --- | --- |\n';
for (const p of batch3_45) {
    markdown += `| **${p.city1.name}** (T${p.city1.tier}) | **${p.city2.name}** (T${p.city2.tier}) | ${p.distance.toFixed(2)} | ${p.city1.factionName} | ${p.city2.factionName} |\n`;
}
console.log(markdown);