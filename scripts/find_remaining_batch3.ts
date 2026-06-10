import * as fs from 'fs';

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
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

const toDeleteNames = [
    '绍兴', '新郑', '麄泠', '古螺城', '平城京', '卑阗城', '高邮', '斡难河源',
    '上京龙泉府', '莺歌岭', '洺州', '密阳', '九坝', '台拱', '邾县', '麻豆社',
    '英额城', '沙济城', '苏子河'
];

const activeCities = cities.filter(c => !toDeleteNames.includes(c.name));

const remainingPairs: any[] = [];

for (let i = 0; i < activeCities.length; i++) {
    for (let j = i + 1; j < activeCities.length; j++) {
        const dist = calculateDistance(activeCities[i].lat, activeCities[i].lng, activeCities[j].lat, activeCities[j].lng);
        if (dist < 50) {
            const g1 = isGeneric(activeCities[i].factionId);
            const g2 = isGeneric(activeCities[j].factionId);
            if (!g1 && !g2) {
                remainingPairs.push({
                    city1: activeCities[i],
                    city2: activeCities[j],
                    distance: dist
                });
            }
        }
    }
}

remainingPairs.sort((a, b) => b.distance - a.distance);

console.log('--- TO DELETE IDS ---');
const toDeleteCities = cities.filter(c => toDeleteNames.includes(c.name));
for (const c of toDeleteCities) {
    console.log(`${c.name} (${c.factionName}) -> ${c.id}`);
}

console.log('\n--- REMAINING CONFLICTS ---');
for (const p of remainingPairs) {
    console.log(`${p.city1.name}(${p.city1.factionName}) vs ${p.city2.name}(${p.city2.factionName}) : ${p.distance.toFixed(2)}km`);
}