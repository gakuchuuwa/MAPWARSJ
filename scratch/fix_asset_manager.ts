import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';
import * as fs from 'fs';

const usedFactionIds = new Set<string>();
CITIES_V2.forEach(c => {
    if (c.factionId && c.factionId !== 'panjun') {
        usedFactionIds.add(c.factionId);
    }
});

const factionMap = new Map(FACTIONS.map(f => [f.id, f.name]));

console.log('--- Syncing CityAssetManager.ts ---');
const assetMgrPath = 'c:\\MAPWARSJ\\src\\core\\CityAssetManager.ts';
let assetMgrLines = fs.readFileSync(assetMgrPath, 'utf8').split('\n');

const startStr = 'public static readonly factionFlagMap: { [key: string]: string } = {';
let startIdx = assetMgrLines.findIndex(l => l.includes(startStr));

if (startIdx !== -1) {
    let endIdx = -1;
    for (let i = startIdx; i < assetMgrLines.length; i++) {
        if (assetMgrLines[i] && assetMgrLines[i].includes('// If the factionId represents one of the Seven Warring States')) {
            endIdx = i - 1;
            while(endIdx > 0 && !assetMgrLines[endIdx].includes('};')) {
                endIdx--;
            }
            break;
        }
    }

    if (endIdx !== -1) {
        usedFactionIds.forEach(id => {
            const name = factionMap.get(id);
            if (!name) return;
            
            let found = false;
            for (let i = startIdx; i < endIdx; i++) {
                if (assetMgrLines[i] && assetMgrLines[i].includes(`'${id}':`)) {
                    assetMgrLines[i] = assetMgrLines[i].replace(new RegExp(`'${id}':\\s*'.*?'`), `'${id}': '${name}'`);
                    found = true;
                    break;
                }
            }

            if (!found) {
                assetMgrLines.splice(endIdx, 0, `        '${id}': '${name}',`);
                endIdx++; // Since we inserted a line, endIdx shifts down
            }
        });
        fs.writeFileSync(assetMgrPath, assetMgrLines.join('\n'), 'utf8');
        console.log('CityAssetManager.ts synced.');
    } else {
        console.log('Could not find end of factionFlagMap');
    }
} else {
    console.log('Could not find factionFlagMap');
}
