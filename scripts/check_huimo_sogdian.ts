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
    { name: '赤柏松古城 (濊貊)', lat: 41.661736, lng: 125.730922 },
    { name: '白金宝遗址 (濊貊)', lat: 45.474100, lng: 124.081500 },
    { name: '罗通山城 (濊貊)', lat: 42.345800, lng: 125.751200 },
    { name: '农安曾家屯遗址 (濊貊)', lat: 44.431200, lng: 125.184500 },
    { name: '瓦拉赫沙遗址 (粟特)', lat: 40.029167, lng: 64.336111 },
    { name: '碎叶城遗址 (粟特)', lat: 42.803889, lng: 75.200833 },
    { name: '明乌里克遗址 (粟特)', lat: 41.299444, lng: 69.276667 },
    { name: '固原粟特墓葬群 (粟特)', lat: 35.945833, lng: 106.269444 }
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