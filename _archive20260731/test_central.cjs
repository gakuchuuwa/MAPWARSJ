const fs = require('fs');

const factionsContent = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
const citiesContent = fs.readFileSync('c:/MAPWARSJ/src/data/cities_v2.ts', 'utf8');
const legionsContent = fs.readFileSync('c:/MAPWARSJ/src/data/CentralExpeditionLegions.ts', 'utf8');

const blocks = citiesContent.split(/id:\s*['"]/);
const cCities = [];

for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const idMatch = b.match(/^([^'"]+)['"]/);
    const nameMatch = b.match(/name:\s*['"]([^'"]+)['"]/);
    const latMatch = b.match(/lat:\s*([-\d.]+)/);
    const lngMatch = b.match(/lng:\s*([-\d.]+)/);
    const regionMatch = b.match(/region:\s*['"]([^'"]+)['"]/);
    const factionMatch = b.match(/factionId:\s*['"]([^'"]+)['"]/);
    
    if (idMatch && nameMatch && latMatch && lngMatch) {
        const region = regionMatch ? regionMatch[1] : null;
        if (region === 'CENTRAL') {
            cCities.push({
                id: idMatch[1],
                name: nameMatch[1],
                factionId: factionMatch ? factionMatch[1] : null,
                lat: parseFloat(latMatch[1]),
                lng: parseFloat(lngMatch[1]),
            });
        }
    }
}

const poly = [{lat:33.07,lng:107.02},{lat:32.01,lng:112.12},{lat:32.45,lng:119.40},{lat:37.20,lng:122.12},{lat:36.59,lng:109.48},{lat:36.04,lng:103.82}];
function inPoly(lat, lng) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].lng, yi = poly[i].lat, xj = poly[j].lng, yj = poly[j].lat;
        const intersect = ((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const idMatch = b.match(/^([^'"]+)['"]/);
    if (!idMatch) continue;
    const nameMatch = b.match(/name:\s*['"]([^'"]+)['"]/);
    const latMatch = b.match(/lat:\s*([-\d.]+)/);
    const lngMatch = b.match(/lng:\s*([-\d.]+)/);
    const regionMatch = b.match(/region:\s*['"]([^'"]+)['"]/);
    const factionMatch = b.match(/factionId:\s*['"]([^'"]+)['"]/);
    
    if (latMatch && lngMatch) {
        const lat = parseFloat(latMatch[1]);
        const lng = parseFloat(lngMatch[1]);
        const region = regionMatch ? regionMatch[1] : null;
        if (inPoly(lat, lng) && region !== 'CENTRAL' && region !== 'NORTH' && region !== 'JIANGNAN' && region !== 'HEXI' && region !== 'BASHU') {
             cCities.push({
                id: idMatch[1],
                name: nameMatch ? nameMatch[1] : '',
                factionId: factionMatch ? factionMatch[1] : null,
                lat, lng, note: 'POLY_ADD'
             });
        }
    }
}

const legions = {};
const legionLines = legionsContent.split('\n');
legionLines.forEach(l => {
    const m = l.match(/([a-zA-Z0-9_]+):\s*{\s*name:\s*['"]([^'"]+)['"]/);
    if (m) {
        legions[m[1]] = m[2];
    }
});

const seenIds = new Set();
const finalCities = [];
cCities.forEach(c => {
    if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        finalCities.push(c);
    }
});

finalCities.forEach(c => {
    const fLine = factionsContent.find(l => l.includes(`id: '${c.factionId}'`));
    const fNameMatch = fLine ? fLine.match(/name:\s*['"]([^'"]+)['"]/) : null;
    const fName = fNameMatch ? fNameMatch[1] : 'Unknown';
    const elite = legions[c.factionId] || '（无专门配置）';
    console.log(`${fName} (${c.factionId}) - 据点：${c.name} - 精锐：${elite === '（无专门配置）' ? elite : '【' + elite + '】'}`);
});
