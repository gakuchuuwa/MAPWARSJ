const fs = require('fs');
function haversineKm(lng1, lat1, lng2, lat2) {
    const R = 6371;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
}
let cSrc = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
cSrc = cSrc.replace(/^\s*import\b[^;]*;\s*$/gm, '');
cSrc = cSrc.replace(/^export\s+interface\s+\w+\s*\{[\s\S]*?^\}/gm, '');
cSrc = cSrc.replace(/^export\s+type\s+[^;]+;\s*$/gm, '');
cSrc = cSrc.replace(/\bexport\s+(const|let|var|function)\b/g, '$1');
cSrc = cSrc.replace(/(const\s+\w+)\s*:\s*[^=]+=/g, '$1 =');
cSrc += '\nreturn CITIES_V2;';
const cities = (new Function(cSrc))();
const gongbu = cities.find(c => c.id === 'city_gongbu');
const luoxie = cities.find(c => c.id === 'city_luoxie');
console.log('Distance gongbu-luoxie:', haversineKm(gongbu.lng, gongbu.lat, luoxie.lng, luoxie.lat));

const neRaw = fs.readFileSync('public/assets/roads_filtered.geojson', 'utf8');
const neData = JSON.parse(neRaw);
const featuresKept = neData.features.filter(f => (f.properties || {}).expressway !== 1);
let minDistGongbu = Infinity;
for (const feat of featuresKept) {
    const coords = feat.geometry && feat.geometry.coordinates;
    if (!coords) continue;
    for (const [lng, lat] of coords) {
        const d = haversineKm(gongbu.lng, gongbu.lat, lng, lat);
        if (d < minDistGongbu) minDistGongbu = d;
    }
}
console.log('gongbu dist to nearest road:', minDistGongbu);
