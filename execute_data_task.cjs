const fs = require('fs');

const factionsToAdd = [
    { id: 'zhancheng', name: '占城', cityId: 'city_dupan' },
    { id: 'monong', name: '墨侬', cityId: 'city_bangdun' },
    { id: 'shuizhen', name: '水真', cityId: 'city_sanpu' }
];

const citiesToAdd = [
    { id: 'city_wuyun', name: '乌云', factionId: 'panjun', lat: 48.98, lng: 129.8, type: 'small_city', troops: 5000 },
    { id: 'city_dupan', name: '阇槃', factionId: 'zhancheng', lat: 13.93, lng: 109.11, type: 'medium_city', troops: 8000 },
    { id: 'city_bangdun', name: '邦敦', factionId: 'monong', lat: 12.87, lng: 107.8, type: 'small_city', troops: 5000 },
    { id: 'city_sanpu', name: '三菩', factionId: 'shuizhen', lat: 12.77, lng: 105.97, type: 'small_city', troops: 5000 }
];

// Helper to safely insert into array ends
function insertIntoArray(file, searchStr, toAddStr) {
    let text = fs.readFileSync(file, 'utf-8');
    text = text.replace(new RegExp(searchStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')), searchStr + '\n' + toAddStr);
    fs.writeFileSync(file, text, 'utf-8');
}

// 1. Add Factions
let factionsAddStr = factionsToAdd.map(f => `    { id: '${f.id}', name: '${f.name}' },`).join('\n');
insertIntoArray('src/data/factions.ts', 'export const FACTIONS: Faction[] = [', factionsAddStr);

let sandboxAddStr = factionsToAdd.map(f => `    '${f.id}': '${f.name}',`).join('\n');
insertIntoArray('src/data/SandboxDisplayNames.ts', 'export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {', sandboxAddStr);

let assetAddStr = factionsToAdd.map(f => `    '${f.id}': '${f.name}',`).join('\n');
insertIntoArray('src/assets/CityAssetManager.ts', 'const factionFlagMap: Record<string, string> = {', assetAddStr);

let gameAddStr = factionsToAdd.map(f => `    '${f.id}': '${f.cityId}',`).join('\n');
insertIntoArray('src/app/GameApp.ts', 'const STARTING_CAPITALS: Record<string, string> = {', gameAddStr);

// 2. Modify cities_v2.ts (Delete Champa & Add New)
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
// Delete city_champa securely
citiesStr = citiesStr.replace(/\{[^}]+id:\s*'city_champa'[^}]+\},?\r?\n?/g, '');
// Add new cities
const citiesAddStr = citiesToAdd.map(c => `    { id: '${c.id}', name: '${c.name}', factionId: '${c.factionId}', lat: ${c.lat}, lng: ${c.lng}, type: '${c.type}', troops: ${c.troops} },`).join('\n');
citiesStr = citiesStr.replace(/];\s*$/, `,\n${citiesAddStr}\n];`);
// Fix missing commas if any
citiesStr = citiesStr.replace(/}([\s]*){ id:/g, '},$1{ id:');
citiesStr = citiesStr.replace(/},\r?\n,\r?\n\s*{/g, '},\n    {');
fs.writeFileSync('src/data/cities_v2.ts', citiesStr, 'utf-8');

// 3. Delete city_champa roads from VectorRoadData.ts
let roadsStr = fs.readFileSync('src/data/VectorRoadData.ts', 'utf-8');
// This regex strictly removes the entire Feature object containing city_champa
roadsStr = roadsStr.replace(/\{[^{}]*?(?:startConnection|endConnection):\s*'city_champa'[^{}]*?(?:\{[^{}]*\}[^{}]*?)*\},?\r?\n?/g, '');
fs.writeFileSync('src/data/VectorRoadData.ts', roadsStr, 'utf-8');

console.log('Successfully added new cities and deleted Zhancheng Port!');
