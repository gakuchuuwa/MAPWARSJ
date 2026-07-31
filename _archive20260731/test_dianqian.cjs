const fs = require('fs');

const factionsContent = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
const citiesContent = fs.readFileSync('c:/MAPWARSJ/src/data/cities_v2.ts', 'utf8');
const legionsContent = fs.readFileSync('c:/MAPWARSJ/src/data/DianQianExpeditionLegions.ts', 'utf8');

const blocks = citiesContent.split(/id:\s*['"]/);
const dqCities = [];

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
        if (region === 'DIANQIAN') {
            dqCities.push({
                id: idMatch[1],
                name: nameMatch[1],
                factionId: factionMatch ? factionMatch[1] : null,
                lat: parseFloat(latMatch[1]),
                lng: parseFloat(lngMatch[1]),
            });
        }
    }
}

const poly = [{lat:30.05,lng:101.96},{lat:26.87,lng:100.22},{lat:27.72,lng:85.19},{lat:17.33,lng:96.47},{lat:16.53,lng:97.63},{lat:14.35,lng:100.58},{lat:13.41,lng:103.87},{lat:28.08,lng:104.25}];
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
        if (inPoly(lat, lng) && region !== 'DIANQIAN' && region !== 'LINGNAN' && region !== 'BASHU' && region !== 'TIBET') {
             dqCities.push({
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
dqCities.forEach(c => {
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
