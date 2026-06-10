const fs = require('fs');
const path = require('path');

const citiesPath = path.join(__dirname, '../src/data/cities_v2.ts');
const factionsPath = path.join(__dirname, '../src/data/factions.ts');
const text = fs.readFileSync(citiesPath, 'utf8');
const factionsText = fs.readFileSync(factionsPath, 'utf8');

const flagNames = {};
for (const m of factionsText.matchAll(/id:\s*'([^']+)',\s*name:\s*'([^']+)'/g)) {
    flagNames[m[1]] = m[2];
}

const cities = [];
for (const line of text.split('\n')) {
    if (!line.includes('id:')) continue;
    const id = (line.match(/id:\s*'([^']+)'/) || [])[1];
    const name = (line.match(/name:\s*'([^']+)'/) || [])[1];
    const factionId = (line.match(/factionId:\s*'([^']+)'/) || [])[1];
    const type = (line.match(/type:\s*'([^']+)'/) || [])[1];
    const lat = parseFloat((line.match(/lat:\s*([0-9.-]+)/) || [])[1]);
    const lng = parseFloat((line.match(/lng:\s*([0-9.-]+)/) || [])[1]);
    const region = (line.match(/region:\s*'([^']+)'/) || [])[1] || '';
    if (id && name && factionId && !Number.isNaN(lat)) {
        cities.push({ id, name, factionId, type: type || '?', lat, lng, region });
    }
}

function dist(a, b) {
    const dlat = a.lat - b.lat;
    const dlng = a.lng - b.lng;
    return Math.sqrt(dlat * dlat + dlng * dlng);
}

const passBound = cities.filter((c) => c.type === 'pass' && c.factionId !== 'panjun');
const panjunAll = cities.filter((c) => c.factionId === 'panjun');
const panjunSpawn = panjunAll.filter((c) =>
    ['small_city', 'medium_city', 'big_city'].includes(c.type)
);

console.log('关隘总数(绑势力非叛军):', passBound.length);
console.log('叛军可出兵据点:', panjunSpawn.length);
console.log('');

for (const pass of passBound) {
    const flag = flagNames[pass.factionId] || pass.factionId;
    const nearbySpawn = panjunSpawn
        .map((p) => ({ ...p, d: dist(pass, p) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 5);
    const nearbyPass = panjunAll
        .filter((p) => p.type === 'pass')
        .map((p) => ({ ...p, d: dist(pass, p) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 5);
    console.log(`--- ${pass.name} (${pass.id}) 旗号:${flag} region:${pass.region || '-'} ---`);
    console.log('  [可出兵叛军小城/中城]');
    for (const p of nearbySpawn) {
        const km = (p.d * 111).toFixed(0);
        console.log(`    ${km}km  ${p.type}  ${p.name}  ${p.id}`);
    }
    console.log('  [近邻叛军关隘-仅驻军]');
    for (const p of nearbyPass) {
        const km = (p.d * 111).toFixed(0);
        console.log(`    ${km}km  ${p.name}  ${p.id}`);
    }
    console.log('');
}
