import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const match = citiesStr.match(/\{\s*id:\s*['"]([^'"]+)['"][^}]*name:\s*['"]定西['"][^}]*factionId:\s*['"]([^'"]+)['"]/);
if (match) {
    console.log('City ID:', match[1], 'Faction ID:', match[2]);
} else {
    console.log('Not found');
}
