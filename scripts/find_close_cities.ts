import { readFileSync, writeFileSync } from 'fs';

// Helper to calculate distance in km using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}

// Read the cities file and extract city data
const citiesContent = readFileSync('./src/data/cities_v2.ts', 'utf-8');

// A simple regex to parse city objects. We look for `{ id: '...', name: '...', factionId: '...', lat: ..., lng: ... }`
// The formatting might be multiline.
interface City {
    id: string;
    name: string;
    factionId: string;
    lat: number;
    lng: number;
    type: string;
    tier: number;
    matchStr: string;
}

const cities: City[] = [];
// This regex matches { id: '...', name: '...', factionId: '...', lat: ..., lng: ..., ... }
const regex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"],\s*factionId:\s*['"]([^'"]+)['"],\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+).*?tier:\s*(\d).*?\}/gs;

let match;
while ((match = regex.exec(citiesContent)) !== null) {
    cities.push({
        matchStr: match[0],
        id: match[1],
        name: match[2],
        factionId: match[3],
        lat: parseFloat(match[4]),
        lng: parseFloat(match[5]),
        type: 'unknown',
        tier: parseInt(match[6])
    });
}

console.log(`Found ${cities.length} cities.`);

const closePairs: any[] = [];
const visited = new Set<string>();
const toRemove = new Set<string>();

// We group cities by closeness
for (let i = 0; i < cities.length; i++) {
    for (let j = i + 1; j < cities.length; j++) {
        const dist = calculateDistance(cities[i].lat, cities[i].lng, cities[j].lat, cities[j].lng);
        if (dist < 50) {
            closePairs.push({
                city1: cities[i],
                city2: cities[j],
                distance: dist
            });
        }
    }
}

// Write the result
writeFileSync('./close_cities_report.json', JSON.stringify(closePairs, null, 2));
console.log(`Found ${closePairs.length} pairs of close cities.`);