import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const names = ['邕州', '登州', '信州', '漳州', '台州', '处州', '田州', '府州', '金州', '贺州'];
for (const name of names) {
    const regex = new RegExp(`\\{\\s*id:\\s*['"]([^'"]+)['"][^}]*name:\\s*['"]${name}['"][^}]*factionId:\\s*['"]([^'"]+)['"]`);
    const match = citiesStr.match(regex);
    if (match) {
        console.log(`${name} -> id: ${match[1]}, factionId: ${match[2]}`);
    } else {
        console.log(`${name} -> NOT FOUND`);
    }
}
