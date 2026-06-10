import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const names = ['兰州', '婺州', '衢州', '虔州', '迭州', '潘州', '茂州', '银州', '武州塞', '全州'];
for (const name of names) {
    const regex = new RegExp(`\\{\\s*id:\\s*['"]([^'"]+)['"][^}]*name:\\s*['"]${name}['"][^}]*factionId:\\s*['"]([^'"]+)['"]`);
    const match = citiesStr.match(regex);
    if (match) {
        console.log(`${name} -> id: ${match[1]}, factionId: ${match[2]}`);
    } else {
        console.log(`${name} -> NOT FOUND`);
    }
}
