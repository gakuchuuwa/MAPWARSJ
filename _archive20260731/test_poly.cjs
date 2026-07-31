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
    if (idMatch && nameMatch && latMatch && lngMatch) {
        cities.push({
            id: idMatch[1],
            name: nameMatch[1],
            factionId: factionMatch ? factionMatch[1] : null,
            lat: parseFloat(latMatch[1]),
            lng: parseFloat(lngMatch[1]),
            region: regionMatch ? regionMatch[1] : null
        });
    }
}
const poly = [{lat:25.75,lng:123.50},{lat:24.81,lng:125.28},{lat:26.22,lng:127.72},{lat:35.68,lng:139.76},{lat:38.99,lng:141.12},{lat:40.50,lng:141.46},{lat:45.50,lng:141.93},{lat:33.51,lng:126.52}];
function inPoly(lat, lng) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i].lng, yi = poly[i].lat, xj = poly[j].lng, yj = poly[j].lat;
        const intersect = ((yi >= lat) !== (yj >= lat)) && (lng <= (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}
cities.forEach(c => {
    if (inPoly(c.lat, c.lng) && c.region !== 'JAPAN') {
        console.log(`In JAPAN polygon but region is ${c.region}: ${c.name} (${c.factionId})`);
    }
    if (!inPoly(c.lat, c.lng) && c.region === 'JAPAN') {
        console.log(`Has JAPAN region but outside polygon: ${c.name} (${c.factionId})`);
    }
});
