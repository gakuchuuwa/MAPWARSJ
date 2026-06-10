const fs = require('fs');

const citiesSrc = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /\{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'([^']+)',\s*lat:\s*([0-9.-]+),\s*lng:\s*([0-9.-]+).*?(?:region:\s*'([^']+)')?.*?(?:note:\s*'([^']+)')?/gs;

let factionsSet = new Set();
let match;
while ((match = cityRegex.exec(citiesSrc)) !== null) {
    const factionId = match[3];
    const region = match[6];
    const note = match[7] || '';
    
    if (region === 'KOREA' || note.includes('朝鲜') || note.includes('高丽') || note.includes('百济') || note.includes('新罗') || note.includes('高句丽') || note.includes('三韩')) {
        factionsSet.add(factionId);
    }
}

console.log(Array.from(factionsSet));
