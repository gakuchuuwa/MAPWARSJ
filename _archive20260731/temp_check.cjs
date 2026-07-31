const fs = require('fs');

const text = fs.readFileSync('src/data/VectorRoadData.ts', 'utf8');
const starts = [...text.matchAll(/startConnection:\s*'([^']+)'/g)].map(m => m[1]);
const ends = [...text.matchAll(/endConnection:\s*'([^']+)'/g)].map(m => m[1]);
const connected = new Set([...starts, ...ends]);

let cSrc = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
cSrc = cSrc.replace(/^\s*import\b[^;]*;\s*$/gm, '');
cSrc = cSrc.replace(/^export\s+interface\s+\w+\s*\{[\s\S]*?^\}/gm, '');
cSrc = cSrc.replace(/^export\s+type\s+[^;]+;\s*$/gm, '');
cSrc = cSrc.replace(/\bexport\s+(const|let|var|function)\b/g, '$1');
cSrc = cSrc.replace(/(const\s+\w+)\s*:\s*[^=]+=/g, '$1 =');
cSrc += '\nreturn CITIES_V2;';
const cities = (new Function(cSrc))();

const isolated = cities.filter(c => !connected.has(c.id));
console.log('Isolated cities:', isolated.length);
isolated.forEach(c => console.log('  ', c.name, c.id));
