const fs = require('fs');
const cities = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /id:\s*'([^']+)'/g;
let m;
const cityIds = new Set();
while ((m = cityRegex.exec(cities)) !== null) { cityIds.add(m[1]); }

const roads = fs.readFileSync('src/data/VectorRoadData.ts', 'utf-8');
const roadRegex1 = /startConnection:\s*['"]([^'"]+)['"]/g;
const roadRegex2 = /endConnection:\s*['"]([^'"]+)['"]/g;
const connected = new Set();
while ((m = roadRegex1.exec(roads)) !== null) { connected.add(m[1]); }
while ((m = roadRegex2.exec(roads)) !== null) { connected.add(m[1]); }

const isolated = [...cityIds].filter(c => !connected.has(c));
console.log('Total isolated cities:', isolated.length);
if (isolated.length < 50) console.log('Isolated cities:', isolated);
