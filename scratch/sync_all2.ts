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

console.log('--- Syncing SandboxDisplayNames.ts ---');
const sandboxPath = 'c:\\MAPWARSJ\\src\\data\\SandboxDisplayNames.ts';
let sandboxLines = fs.readFileSync(sandboxPath, 'utf8').split('\n');
usedFactionIds.forEach(id => {
    const name = factionMap.get(id);
    if (!name) return;
    const idx = sandboxLines.findIndex(line => line.includes(`'${id}':`));
    if (idx !== -1) {
        // Update existing
        sandboxLines[idx] = sandboxLines[idx].replace(new RegExp(`'${id}':\\s*'.*?'`), `'${id}': '${name}'`);
    } else {
        // Insert before last '};'
        const lastBraceIdx = sandboxLines.findIndex(l => l.startsWith('};'));
        if (lastBraceIdx !== -1) {
            sandboxLines.splice(lastBraceIdx, 0, `    '${id}': '${name}',`);
        }
    }
});
fs.writeFileSync(sandboxPath, sandboxLines.join('\n'), 'utf8');


console.log('--- Syncing GameApp.ts ---');
const gameAppPath = 'c:\\MAPWARSJ\\src\\core\\GameApp.ts';
let gameAppLines = fs.readFileSync(gameAppPath, 'utf8').split('\n');
usedFactionIds.forEach(id => {
    const idx = gameAppLines.findIndex(line => line.includes(`'${id}':`));
    if (idx === -1) {
        const city = CITIES_V2.find(c => c.factionId === id);
        if (city) {
            // Find the line with `export class GameApp {` and insert before the `};` preceding it
            const classIdx = gameAppLines.findIndex(l => l.includes('export class GameApp {'));
            if (classIdx !== -1) {
                // backtrack to find };
                let insertIdx = classIdx;
                while (insertIdx > 0 && !gameAppLines[insertIdx].startsWith('};')) {
                    insertIdx--;
                }
                if (insertIdx > 0) {
                    gameAppLines.splice(insertIdx, 0, `    '${id}': '${city.id}',`);
                }
            }
        }
    }
});
fs.writeFileSync(gameAppPath, gameAppLines.join('\n'), 'utf8');


console.log('--- Syncing CityAssetManager.ts ---');
const assetMgrPath = 'c:\\MAPWARSJ\\src\\core\\CityAssetManager.ts';
let assetMgrLines = fs.readFileSync(assetMgrPath, 'utf8').split('\n');
usedFactionIds.forEach(id => {
    const name = factionMap.get(id);
    if (!name) return;
    
    // We search within _legacy_sandbox_dict
    let found = false;
    let startIdx = assetMgrLines.findIndex(l => l.includes('const _legacy_sandbox_dict'));
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
    
    for (let i = startIdx; i < (endIdx === -1 ? assetMgrLines.length : endIdx); i++) {
        if (assetMgrLines[i] && assetMgrLines[i].includes(`'${id}':`)) {
            assetMgrLines[i] = assetMgrLines[i].replace(new RegExp(`'${id}':\\s*'.*?'`), `'${id}': '${name}'`);
            found = true;
            break;
        }
    }

    if (!found && endIdx !== -1) {
        assetMgrLines.splice(endIdx, 0, `            '${id}': '${name}',`);
    }
});
fs.writeFileSync(assetMgrPath, assetMgrLines.join('\n'), 'utf8');
console.log('=== 三大文件同步脚本运行完毕 ===');
