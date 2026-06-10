
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

// 1. Sync SandboxDisplayNames
const sandboxPath = 'c:\\MAPWARSJ\\src\\data\\SandboxDisplayNames.ts';
let sandboxContent = fs.readFileSync(sandboxPath, 'utf8');
usedFactionIds.forEach(id => {
    const name = factionMap.get(id);
    if (!name) return;
    const regex = new RegExp(`'\$\{id\}':\s*'.*?'`);
    if (sandboxContent.match(regex)) {
        sandboxContent = sandboxContent.replace(regex, `'${id}': '${name}'`);
    } else {
        sandboxContent = sandboxContent.replace(/};s*$/, `    '${id}': '${name}',\n};
`);
    }
});
fs.writeFileSync(sandboxPath, sandboxContent, 'utf8');

// 2. Sync GameApp.ts
const gameAppPath = 'c:\\MAPWARSJ\\src\\core\\GameApp.ts';
let gameAppContent = fs.readFileSync(gameAppPath, 'utf8');
usedFactionIds.forEach(id => {
    if (!gameAppContent.includes(`'${id}':`)) {
        const city = CITIES_V2.find(c => c.factionId === id);
        if (city) {
            gameAppContent = gameAppContent.replace(/};s*\n\s*export class GameApp/, `    '${id}': '${city.id}',\n};\n\nexport class GameApp`);
        }
    }
});
fs.writeFileSync(gameAppPath, gameAppContent, 'utf8');

// 3. Sync CityAssetManager.ts
const assetMgrPath = 'c:\\MAPWARSJ\\src\\core\\CityAssetManager.ts';
let assetMgrContent = fs.readFileSync(assetMgrPath, 'utf8');
usedFactionIds.forEach(id => {
    const name = factionMap.get(id);
    if (!name) return;
    if (!assetMgrContent.includes(`'${id}':`)) {
        assetMgrContent = assetMgrContent.replace(/};s*\n\s*\/\/ If the factionId represents one of the Seven Warring States/, `    '${id}': '${name}',\n        };\n\n        // If the factionId represents one of the Seven Warring States`);
    } else {
        // Also fix the text in CityAssetManager if it's wrong (e.g. for duplicates we just renamed)
        const regex = new RegExp(`'\$\{id\}':\s*'.*?'`);
        assetMgrContent = assetMgrContent.replace(regex, `'${id}': '${name}'`);
    }
});
fs.writeFileSync(assetMgrPath, assetMgrContent, 'utf8');
console.log('=== 三大文件同步完成 ===');
