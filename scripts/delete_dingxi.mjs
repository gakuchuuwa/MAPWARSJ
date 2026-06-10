import fs from 'fs';

// Delete from cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
citiesStr = citiesStr.replace(/\s*\{[^}]*id:\s*['"]city_xiangwu['"][^}]*\}[,;]?/, '');
fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

console.log('Successfully deleted Dingxi!');
