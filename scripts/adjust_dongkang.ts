function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
// Suifenhe coords from cities_v2.ts: Let's find it.
import * as fs from 'fs';
const txt = fs.readFileSync('./src/data/cities_v2.ts', 'utf8');
const m = txt.match(/name:\s*'绥芬河'.*?lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+)/s);
const slat = parseFloat(m![1]);
const slng = parseFloat(m![2]);
console.log('Suifenhe:', slat, slng);

let dlat = 44.4375;
let dlng = 131.211667;
let dist = calculateDistance(dlat, dlng, slat, slng);

while(dist < 51) {
    if (dlat > slat) dlat += 0.01; else dlat -= 0.01;
    if (dlng > slng) dlng += 0.01; else dlng -= 0.01;
    dist = calculateDistance(dlat, dlng, slat, slng);
}

console.log('New Dongkang:', dlat.toFixed(6), dlng.toFixed(6), 'Dist:', dist.toFixed(2));