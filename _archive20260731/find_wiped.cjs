const fs = require('fs');
const cities = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /id:\s*'([^']+)'/g;
let m;
const cityIds = new Set();
while ((m = cityRegex.exec(cities)) !== null) { cityIds.add(m[1]); }

const roads = fs.readFileSync('src/data/VectorRoadData.ts', 'utf-8');
const roadRegex1 = /startConnection:\s*['"]([^'"]+)['"]/g;
const roadRegex2 = /endConnection:\s*['"]([^'"]+)['"]/g;
const roadCities = new Set();
while ((m = roadRegex1.exec(roads)) !== null) { roadCities.add(m[1]); }
while ((m = roadRegex2.exec(roads)) !== null) { roadCities.add(m[1]); }

const missingCities = [...roadCities].filter(c => !cityIds.has(c));
console.log('Cities present in roads but missing in cities_v2.ts:');
console.log(missingCities);
