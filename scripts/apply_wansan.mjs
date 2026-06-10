import fs from 'fs';

// 1. cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
citiesStr = citiesStr.replace(
    /\{[\s\n]*id:\s*'city_jeonju',[\s\n]*name:\s*'全州',[\s\n]*factionId:\s*'piao'([^}]+)\}/,
    `{\n        id: 'city_jeonju',\n        name: '完山',\n        factionId: 'zhen'$1}`
);
fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
factionsStr = factionsStr.replace(/\{ id: 'piao', name: '朴' \},.*\n/, '');
factionsStr = factionsStr.replace(/(export const FACTIONS: Faction\[\] = \[)/, `$1\n    { id: 'zhen', name: '后百济' },`);
fs.writeFileSync('src/data/factions.ts', factionsStr);

// 3. GameApp.ts
let gameAppStr = fs.readFileSync('src/app/GameApp.ts', 'utf8');
gameAppStr = gameAppStr.replace(/.*'piao'.*\n/, '');
gameAppStr = gameAppStr.replace(/(export const STARTING_CAPITALS: Record<string, string> = \{)/, `$1\n    'zhen': 'city_jeonju',`);
fs.writeFileSync('src/app/GameApp.ts', gameAppStr);

// 4. CityAssetManager.ts
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
camStr = camStr.replace(/.*'piao'.*\n/, '');
camStr = camStr.replace(/(public static readonly factionFlagMap: \{ \[key: string\]: string \} = \{)/, `$1\n        'zhen': '甄',`);
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

// 5. SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
sdnStr = sdnStr.replace(/.*'piao'.*\n/, '');
sdnStr = sdnStr.replace(/(export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{)/, `$1\n    'zhen': '甄',`);
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

console.log('Successfully applied Wansan rename and Zhen flag!');
