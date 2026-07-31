const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const regex = /name:\s*'([^']*州[^']*)'/g;
let match;
const zhouCities = new Set();
while ((match = regex.exec(content)) !== null) {
    zhouCities.add(match[1]);
}
console.log(Array.from(zhouCities).join(', '));
console.log(`Total: ${zhouCities.size}`);
