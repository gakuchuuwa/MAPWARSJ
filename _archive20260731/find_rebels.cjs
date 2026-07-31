const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'panjun'[^}]*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)[^}]*}/g;
let match;
while ((match = cityRegex.exec(content)) !== null) {
    const lat = parseFloat(match[3]);
    const lng = parseFloat(match[4]);
    if (lat > 40 && lat < 46 && lng > 115 && lng < 125) {
        console.log(`${match[2]} | lat: ${lat}, lng: ${lng}`);
    }
}
