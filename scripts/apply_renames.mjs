import fs from 'fs';

// 1. cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
// Remove city_lean_sd
citiesStr = citiesStr.replace(/.*\{ id: 'city_lean_sd'.*\n/, '');
// Update city_dongshengzhou
citiesStr = citiesStr.replace(
    /\{ id: 'city_dongshengzhou', name: '东胜州', factionId: 'panjun'([^}]+)\}/,
    `{ id: 'city_dongshengzhou', name: '东胜卫', factionId: 'dongshengwei'$1}`
);
// Update city_wudingzhou
citiesStr = citiesStr.replace(
    /\{ id: 'city_wudingzhou', name: '武定州', factionId: 'panjun'([^}]+)\}/,
    `{ id: 'city_wudingzhou', name: '乐安', factionId: 'dizhou'$1}`
);
fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
factionsStr = factionsStr.replace(/.*\{ id: 'zhu_gaoxu', name: '汉叛' \},.*\n/, '');
factionsStr = factionsStr.replace(/(export const FACTIONS: FactionData\[\] = \[)/, `$1\n    { id: 'dongshengwei', name: '东胜卫' },\n    { id: 'dizhou', name: '棣州' },`);
fs.writeFileSync('src/data/factions.ts', factionsStr);

// 3. GameApp.ts
let gameAppStr = fs.readFileSync('src/app/GameApp.ts', 'utf8');
gameAppStr = gameAppStr.replace(/.*'zhu_gaoxu'.*\n/, '');
gameAppStr = gameAppStr.replace(/(export const STARTING_CAPITALS: Record<string, string> = \{)/, `$1\n    'dongshengwei': 'city_dongshengzhou',\n    'dizhou': 'city_wudingzhou',`);
fs.writeFileSync('src/app/GameApp.ts', gameAppStr);

// 4. CityAssetManager.ts
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
camStr = camStr.replace(/.*'zhu_gaoxu'.*\n/, '');
camStr = camStr.replace(/(public static readonly factionFlagMap: \{ \[key: string\]: string \} = \{)/, `$1\n        'dongshengwei': '胜',\n        'dizhou': '棣',`);
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

// 5. SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
sdnStr = sdnStr.replace(/.*'zhu_gaoxu'.*\n/, '');
sdnStr = sdnStr.replace(/(export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{)/, `$1\n    'dongshengwei': '胜',\n    'dizhou': '棣',`);
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

console.log('Update complete!');
