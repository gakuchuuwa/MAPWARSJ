const fs = require('fs');

const mappings = [
    { name: '瓦剌', id: 'wala', city: '博尔巴任' },
    { name: '兀良哈', id: 'wuliangha', city: '赛音山达' },
    { name: '丁零', id: 'dingling', city: '燕然山' },
    { name: '尼夫赫', id: 'nifuhe', city: '盆奴里' }
];

// 1. cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
for (const m of mappings) {
    const regex = new RegExp(`(name:\\s*'${m.city}'[\\s\\S]*?factionId:\\s*')panjun(')`);
    citiesStr = citiesStr.replace(regex, `$1${m.id}$2`);
}
fs.writeFileSync('src/data/cities_v2.ts', citiesStr, 'utf-8');

// 2. factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf-8');
const toAddFactions = mappings.map(m => `    { id: '${m.id}', name: '${m.name}' },`).join('\n');
factionsStr = factionsStr.replace('export const FACTIONS: Faction[] = [\n', `export const FACTIONS: Faction[] = [\n${toAddFactions}\n`);
fs.writeFileSync('src/data/factions.ts', factionsStr, 'utf-8');

// 3. SandboxDisplayNames.ts
let sandboxStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf-8');
const toAddSandbox = mappings.map(m => `    '${m.id}': '${m.name}',`).join('\n');
sandboxStr = sandboxStr.replace('export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {\n', `export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {\n${toAddSandbox}\n`);
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sandboxStr, 'utf-8');

// 4. CityAssetManager.ts
let assetStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8');
const toAddAsset = mappings.map(m => `    '${m.id}': '${m.name}',`).join('\n');
assetStr = assetStr.replace('const factionFlagMap: Record<string, string> = {\n', `const factionFlagMap: Record<string, string> = {\n${toAddAsset}\n`);
fs.writeFileSync('src/assets/CityAssetManager.ts', assetStr, 'utf-8');

// 5. GameApp.ts
let gameStr = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
const toAddGame = mappings.map(m => `    '${m.id}': 'city_${m.city === '博尔巴任' ? 'porbazhyn' : m.city === '赛音山达' ? 'saiyinshanda' : m.city === '燕然山' ? 'yanran' : 'pennuli'}',`).join('\n');
gameStr = gameStr.replace('const STARTING_CAPITALS: Record<string, string> = {\n', `const STARTING_CAPITALS: Record<string, string> = {\n${toAddGame}\n`);
fs.writeFileSync('src/app/GameApp.ts', gameStr, 'utf-8');

console.log('Successfully updated all 5 files!');
