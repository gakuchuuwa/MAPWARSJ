const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)',\s*factionId:\s*'([^']+)'[^}]*lat:\s*([\d.-]+),\s*lng:\s*([\d.-]+)[^}]*}/g;
let match;
while ((match = cityRegex.exec(content)) !== null) {
    const lat = parseFloat(match[4]);
    const lng = parseFloat(match[5]);
    if (lat > 40 && lat < 45 && lng > 116 && lng < 122) {
        console.log(`${match[2]} (${match[3]}) | lat: ${lat}, lng: ${lng}`);
    }
}
