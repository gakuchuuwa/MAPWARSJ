import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
console.log('juandu cities:', (citiesStr.match(/factionId:\s*['"]juandu['"]/g) || []).length);
console.log('fuca cities:', (citiesStr.match(/factionId:\s*['"]fuca['"]/g) || []).length);
