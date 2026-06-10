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
const cities: any[] = [];
let match;
while ((match = cityRegex.exec(content)) !== null) {
    cities.push({ name: match[2], lat: parseFloat(match[4]), lng: parseFloat(match[5]) });
}

const options = [
    { name: '饶乐水老营', lat: 43.2555, lng: 118.5125 },
    { name: '统万城', lat: 37.9980, lng: 108.8633 },
    { name: '同州武乡郡', lat: 34.7972, lng: 109.9430 },
    { name: '孝陵', lat: 34.4366, lng: 108.7402 }
];

for (const opt of options) {
    let min_dist = 999999;
    let closest_city = '';
    for (const c of cities) {
        const d = calculateDistance(opt.lat, opt.lng, c.lat, c.lng);
        if (d < min_dist) {
            min_dist = d;
            closest_city = c.name;
        }
    }
    console.log(`${opt.name}: Closest is ${closest_city} at ${min_dist.toFixed(2)} km`);
}