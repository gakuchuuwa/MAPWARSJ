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

const cities: any = {};
let match;
while ((match = cityRegex.exec(content)) !== null) {
    if (match[2] === '新郑' || match[2] === '开封' || match[2] === '虎牢关') {
        cities[match[2]] = { lat: parseFloat(match[4]), lng: parseFloat(match[5]) };
    }
}

if (cities['新郑'] && cities['开封']) {
    console.log('新郑 to 开封: ' + calculateDistance(cities['新郑'].lat, cities['新郑'].lng, cities['开封'].lat, cities['开封'].lng).toFixed(2) + ' km');
} else {
    console.log('Could not find 新郑 or 开封');
}

if (cities['新郑'] && cities['虎牢关']) {
    console.log('新郑 to 虎牢关: ' + calculateDistance(cities['新郑'].lat, cities['新郑'].lng, cities['虎牢关'].lat, cities['虎牢关'].lng).toFixed(2) + ' km');
} else {
    console.log('Could not find 虎牢关');
}