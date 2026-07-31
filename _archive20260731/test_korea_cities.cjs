const fs = require('fs');
const content = fs.readFileSync('c:/MAPWARSJ/src/data/cities_v2.ts', 'utf8');
const blocks = content.split(/id:\s*['"]/);
const cities = [];
for (let i = 1; i < blocks.length; i++) {
    const b = blocks[i];
    const idMatch = b.match(/^([^'"]+)['"]/);
    const nameMatch = b.match(/name:\s*['"]([^'"]+)['"]/);
    const latMatch = b.match(/lat:\s*([-\d.]+)/);
    const lngMatch = b.match(/lng:\s*([-\d.]+)/);
    const regionMatch = b.match(/region:\s*['"]([^'"]+)['"]/);
    const factionMatch = b.match(/factionId:\s*['"]([^'"]+)['"]/);
    const noteMatch = b.match(/note:\s*['"]([^'"]+)['"]/);
    if (idMatch && nameMatch && latMatch && lngMatch) {
        cities.push({
            id: idMatch[1],
            name: nameMatch[1],
            factionId: factionMatch ? factionMatch[1] : null,
            lat: parseFloat(latMatch[1]),
            lng: parseFloat(lngMatch[1]),
            region: regionMatch ? regionMatch[1] : null,
            note: noteMatch ? noteMatch[1] : ''
        });
    }
}
const poly = [{lat:41.27,lng:123.17},{lat:37.20,lng:122.05},{lat:32.45,lng:119.40},{lat:33.51,lng:126.52},{lat:45.50,lng:141.93}];
function inPoly(lat, lng) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].lng, yi = poly[i].lat, xj = poly[j].lng, yj = poly[j].lat;
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
cities.forEach(c => {
    if (c.region === 'KOREA' || (inPoly(c.lat, c.lng) && c.region !== 'JAPAN' && c.region !== 'NORTH' && c.region !== 'JIANGNAN' && c.region !== 'NORTHEAST' && c.region !== 'STEPPE' && c.region !== 'CENTRAL' && c.region !== 'LINGNAN')) {
        console.log(JSON.stringify(c));
    }
});
