const fs = require('fs');

// 1. Update RegionSystem.ts
let regionStr = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');
// Insert Nurgan into the NORTHEAST polygon
const nurganPoint = "                { lat: 52.21, lng: 141.95 }, // 囊哈儿卫\n                { lat: 52.92, lng: 139.77 }, // 奴儿干";
regionStr = regionStr.replace("{ lat: 52.21, lng: 141.95 }, // 囊哈儿卫", nurganPoint);
fs.writeFileSync('src/systems/RegionSystem.ts', regionStr, 'utf-8');

// 2. Update cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const nurganCity = "    { id: 'city_nuergan', name: '奴儿干', factionId: 'woji', lat: 52.92, lng: 139.77, type: 'small_city', region: 'NORTHEAST', troops: 5000 },\n];";
citiesStr = citiesStr.replace(/];\s*$/, nurganCity);
fs.writeFileSync('src/data/cities_v2.ts', citiesStr, 'utf-8');

// 3. factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf-8');
const wojiFaction = "    { id: 'woji', name: '窝集' },";
factionsStr = factionsStr.replace('export const FACTIONS: Faction[] = [\n', `export const FACTIONS: Faction[] = [\n${wojiFaction}\n`);
fs.writeFileSync('src/data/factions.ts', factionsStr, 'utf-8');

// 4. SandboxDisplayNames.ts
let sandboxStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf-8');
sandboxStr = sandboxStr.replace('export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {\n', `export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {\n    'woji': '窝集',\n`);
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sandboxStr, 'utf-8');

// 5. CityAssetManager.ts
let assetStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8');
assetStr = assetStr.replace('const factionFlagMap: Record<string, string> = {\n', `const factionFlagMap: Record<string, string> = {\n    'woji': '窝集',\n`);
fs.writeFileSync('src/assets/CityAssetManager.ts', assetStr, 'utf-8');

// 6. GameApp.ts
let gameStr = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
gameStr = gameStr.replace('const STARTING_CAPITALS: Record<string, string> = {\n', `const STARTING_CAPITALS: Record<string, string> = {\n    'woji': 'city_nuergan',\n`);
fs.writeFileSync('src/app/GameApp.ts', gameStr, 'utf-8');

console.log('Successfully added Nurgan and expanded the NORTHEAST polygon!');
