import * as fs from 'fs';
const citiesContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const cityRegex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/gs;
let match;
while ((match = cityRegex.exec(citiesContent)) !== null) {
    if (['南京', '历阳', '剡县', '绍兴', '黎阳', '濮阳', '盛乐', '归化城', '汪吉河', '浚稽山', '沙县', '延平'].includes(match[2])) {
        console.log(match[2] + ': ' + match[1]);
    }
}