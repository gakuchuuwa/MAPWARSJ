import fs from 'fs';

// 1. Rename cities in cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const cityUpdates = [
    { oldName: '兰州', newName: '皋兰' },
    { oldName: '婺州', newName: '金华' },
    { oldName: '衢州', newName: '信安' },
    { oldName: '虔州', newName: '南康' },
    { oldName: '迭州', newName: '合川' },
    { oldName: '潘州', newName: '茂名' },
    { oldName: '茂州', newName: '汶川' },
    { oldName: '银州', newName: '雕阴' },
];

for (const update of cityUpdates) {
    const regex = new RegExp(`name:\\s*['"]${update.oldName}['"]`, 'g');
    citiesStr = citiesStr.replace(regex, `name: '${update.newName}'`);
}

// Special update for 武州塞 -> 平城 (needs faction change from panjun to pingcheng)
citiesStr = citiesStr.replace(
    /\{ id: 'city_wuzhousai', name: '武州塞', factionId: 'panjun'([^}]+)\}/,
    `{ id: 'city_wuzhousai', name: '平城', factionId: 'pingcheng'$1}`
);

fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. Add new faction 'pingcheng' to factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
factionsStr = factionsStr.replace(/(export const FACTIONS: Faction\[\] = \[)/, `$1\n    { id: 'pingcheng', name: '平城' },`);
fs.writeFileSync('src/data/factions.ts', factionsStr);

// 3. Add new faction to GameApp.ts
let gameAppStr = fs.readFileSync('src/app/GameApp.ts', 'utf8');
gameAppStr = gameAppStr.replace(/(export const STARTING_CAPITALS: Record<string, string> = \{)/, `$1\n    'pingcheng': 'city_wuzhousai',`);
fs.writeFileSync('src/app/GameApp.ts', gameAppStr);

// 4. Update flags in SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const flagUpdates = {
    'xiqin': '兰',
    'lujian': '婺',
    'gumie': '衢',
    'kejia': '赣',
    'dangchang': '迭',
    'gaoliang': '潘',
    'qingqiang': '茂',
    'liangshidu': '银'
};

for (const [factionId, flag] of Object.entries(flagUpdates)) {
    const regex = new RegExp(`['"\`]${factionId}['"\`]\\s*:\\s*['"\`][^'"\`]+['"\`]`, 'g');
    if (sdnStr.match(regex)) {
        sdnStr = sdnStr.replace(regex, `'${factionId}': '${flag}'`);
    } else {
        console.log(`Warning: ${factionId} not found in SandboxDisplayNames`);
    }
}
// Add pingcheng flag
sdnStr = sdnStr.replace(/(export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{)/, `$1\n    'pingcheng': '武',`);
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

// 5. Update flags in CityAssetManager.ts (factionFlagMap)
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');

for (const [factionId, flag] of Object.entries(flagUpdates)) {
    const regex = new RegExp(`['"\`]${factionId}['"\`]\\s*:\\s*['"\`][^'"\`]+['"\`]`, 'g');
    if (camStr.match(regex)) {
        camStr = camStr.replace(regex, `'${factionId}': '${flag}'`);
    }
}
// Add pingcheng flag
camStr = camStr.replace(/(public static readonly factionFlagMap: \{ \[key: string\]: string \} = \{)/, `$1\n        'pingcheng': '武',`);
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

console.log('Successfully applied 9 city renames and flag updates!');
