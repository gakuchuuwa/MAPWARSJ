const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'panjun'[^}]*type:\s*'([^']+)'[^}]*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)[^}]*}/g;
let match;
while ((match = cityRegex.exec(content)) !== null) {
    const name = match[2];
    const type = match[3];
    const lat = parseFloat(match[4]);
    const lng = parseFloat(match[5]);
    
    if (type !== 'pass') {
        console.log(`${name} | type: ${type} | lat: ${lat}, lng: ${lng}`);
    }
}
