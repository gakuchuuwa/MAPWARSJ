const fs = require('fs');

const factionsToAdd = [
    { id: 'wala', name: '瓦剌', cityId: 'city_porbazhyn' },
    { id: 'wuliangha', name: '兀良哈', cityId: 'city_saiyinshanda' },
    { id: 'dingling', name: '丁零', cityId: 'city_yanran' },
    { id: 'nifuhe', name: '尼夫赫', cityId: 'city_pennuli' },
    { id: 'guer', name: '古尔', cityId: 'city_malulude' },
    { id: 'bade', name: '巴德', cityId: 'city_pengdi' },
    { id: 'xiajiasi', name: '黠戛斯', cityId: 'city_wubusabo' }
];

const citiesToAdd = [
    { id: 'city_malulude', name: '马鲁鲁德', factionId: 'guer', lat: 35.58, lng: 63.31, type: 'small_city', troops: 5000 },
    { id: 'city_pengdi', name: '彭迪', factionId: 'bade', lat: 36.0, lng: 62.7, type: 'small_city', troops: 5000 },
    { id: 'city_wubusabo', name: '乌布萨泊', factionId: 'xiajiasi', lat: 49.9762, lng: 92.0929, type: 'small_city', troops: 5000 },
    { id: 'city_zhenzhuhe', name: '真珠河', factionId: 'panjun', lat: 41.2773, lng: 67.9312, type: 'small_city', troops: 5000 }
];

function insertIntoArray(file, searchStr, toAddStr) {
    let text = fs.readFileSync(file, 'utf-8');
    text = text.replace(new RegExp(searchStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')), searchStr + '\n' + toAddStr);
    fs.writeFileSync(file, text, 'utf-8');
}

// 1. factions.ts
let factionsAddStr = factionsToAdd.map(f => `    { id: '${f.id}', name: '${f.name}' },`).join('\n');
insertIntoArray('src/data/factions.ts', 'export const FACTIONS: Faction[] = [', factionsAddStr);

// 2. SandboxDisplayNames.ts
let sandboxAddStr = factionsToAdd.map(f => `    '${f.id}': '${f.name}',`).join('\n');
insertIntoArray('src/data/SandboxDisplayNames.ts', 'export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {', sandboxAddStr);

// 3. CityAssetManager.ts
let assetAddStr = factionsToAdd.map(f => `    '${f.id}': '${f.name}',`).join('\n');
insertIntoArray('src/assets/CityAssetManager.ts', 'const factionFlagMap: Record<string, string> = {', assetAddStr);

// 4. GameApp.ts
let gameAddStr = factionsToAdd.map(f => `    '${f.id}': '${f.cityId}',`).join('\n');
insertIntoArray('src/app/GameApp.ts', 'const STARTING_CAPITALS: Record<string, string> = {', gameAddStr);

// 5. cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const citiesAddStr = citiesToAdd.map(c => `    { id: '${c.id}', name: '${c.name}', factionId: '${c.factionId}', lat: ${c.lat}, lng: ${c.lng}, type: '${c.type}', troops: ${c.troops} },`).join('\n');
citiesStr = citiesStr.replace(/];\s*$/, `,\n${citiesAddStr}\n];`);
// Fix any missing commas
citiesStr = citiesStr.replace(/}([\s]*){ id:/g, '},$1{ id:');
fs.writeFileSync('src/data/cities_v2.ts', citiesStr, 'utf-8');

console.log('Successfully fixed nifuhe and added the new factions & cities!');
