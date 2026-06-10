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

let dlat = 40.029167;
let dlng = 64.336111;

for (let i = 0; i < 30; i++) {
    dlat += 0.01;
    dlng -= 0.01;
    let min_dist = 999999;
    for (const c of cities) {
        const d = calculateDistance(dlat, dlng, c.lat, c.lng);
        if (d < min_dist) min_dist = d;
    }
    if (min_dist > 51) break;
}
console.log('Varaksha adjusted:', dlat.toFixed(4), dlng.toFixed(4));

let glat = 35.945833;
let glng = 106.269444;

for (let i = 0; i < 30; i++) {
    glng += 0.01;
    let min_dist = 999999;
    for (const c of cities) {
        const d = calculateDistance(glat, glng, c.lat, c.lng);
        if (d < min_dist) min_dist = d;
    }
    if (min_dist > 51) break;
}
console.log('Guyuan adjusted:', glat.toFixed(4), glng.toFixed(4));