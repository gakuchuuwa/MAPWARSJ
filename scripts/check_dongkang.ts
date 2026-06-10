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

const lat = 44.4375;
const lng = 131.211667;

let match;
let min_dist = 999999;
let closest_city = '';

while ((match = cityRegex.exec(content)) !== null) {
    const c_lat = parseFloat(match[4]);
    const c_lng = parseFloat(match[5]);
    const d = calculateDistance(lat, lng, c_lat, c_lng);
    if (d < min_dist) {
        min_dist = d;
        closest_city = match[2];
    }
}
console.log('Closest city is ' + closest_city + ' at ' + min_dist.toFixed(2) + ' km');