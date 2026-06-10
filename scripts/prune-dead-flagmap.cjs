/**
 * Remove factionFlagMap entries whose factionId is not in factions.ts
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const camPath = path.join(root, 'src/assets/CityAssetManager.ts');
const facPath = path.join(root, 'src/data/factions.ts');

const facSrc = fs.readFileSync(facPath, 'utf8');
const facIds = new Set();
for (const m of facSrc.matchAll(/\{\s*id:\s*'([^']+)',\s*name:/g)) facIds.add(m[1]);

const lines = fs.readFileSync(camPath, 'utf8').split('\n');
let inMap = false;
let removed = 0;
const out = [];

for (const line of lines) {
    if (line.includes('factionFlagMap:')) {
        inMap = true;
        out.push(line);
        continue;
    }
    if (inMap) {
        if (/^\s*\};?\s*$/.test(line)) {
            inMap = false;
            out.push(line);
            continue;
        }
        const m = line.match(/^\s*'([^']+)':/);
        if (m && !facIds.has(m[1])) {
            removed++;
            continue;
        }
        out.push(line);
        continue;
    }
    out.push(line);
}

fs.writeFileSync(camPath, out.join('\n'));
console.log('Removed', removed, 'dead factionFlagMap entries');
