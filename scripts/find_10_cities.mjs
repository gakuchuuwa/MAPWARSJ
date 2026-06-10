import fs from 'fs';
const citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const names = ['泾州', '江州', '简州', '绛州', '徐州', '福州', '陈州', '扬州', '随州', '常州'];
for (const name of names) {
    const regex = new RegExp(`\\{\\s*id:\\s*['"]([^'"]+)['"][^}]*name:\\s*['"]${name}['"][^}]*factionId:\\s*['"]([^'"]+)['"]`);
    const match = citiesStr.match(regex);
    if (match) {
        console.log(`${name} -> id: ${match[1]}, factionId: ${match[2]}`);
    } else {
        console.log(`${name} -> NOT FOUND`);
    }
}
