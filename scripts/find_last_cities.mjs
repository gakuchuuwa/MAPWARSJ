import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const names = ['矩州', '尚州', '净州', '辰州', '沅州', '邠州', '灵州'];
for (const name of names) {
    const regex = new RegExp(`\\{\\s*id:\\s*['"]([^'"]+)['"][^}]*name:\\s*['"]${name}['"][^}]*factionId:\\s*['"]([^'"]+)['"]`);
    const match = citiesStr.match(regex);
    if (match) {
        console.log(`${name} -> id: ${match[1]}, factionId: ${match[2]}`);
    } else {
        console.log(`${name} -> NOT FOUND`);
    }
}
