const fs = require('fs');
const appContent = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
const cityContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

const startIdx = appContent.indexOf('const STARTING_CAPITALS: Record<string, string> = {');
const endIdx = appContent.indexOf('};', startIdx);
const capitalsBlock = appContent.substring(startIdx, endIdx + 1);

const capitals = {};
const regex = /'([^']+)':\s*'([^']+)'/g;
let m;
while ((m = regex.exec(capitalsBlock)) !== null) {
    capitals[m[1]] = m[2];
}

const missing = [];
for (const [factionId, cityId] of Object.entries(capitals)) {
    if (!cityContent.includes(`id: '${cityId}'`)) {
        missing.push({ factionId, cityId });
    }
}
console.log('Missing capitals:', missing);
