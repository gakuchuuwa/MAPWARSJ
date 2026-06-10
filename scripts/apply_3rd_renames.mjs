import fs from 'fs';

// 1. Rename the 10 cities in cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const cityUpdates = [
    { oldName: '邕州', newName: '晋兴' },
    { oldName: '登州', newName: '蓬莱' },
    { oldName: '信州', newName: '上饶' },
    { oldName: '漳州', newName: '龙溪' },
    { oldName: '台州', newName: '临海' },
    { oldName: '处州', newName: '丽水' },
    { oldName: '田州', newName: '横山' },
    { oldName: '府州', newName: '府谷' },
    { oldName: '金州', newName: '安康' },
    { oldName: '贺州', newName: '临贺' },
];

for (const update of cityUpdates) {
    const regex = new RegExp(`name:\\s*['"]${update.oldName}['"]`, 'g');
    citiesStr = citiesStr.replace(regex, `name: '${update.newName}'`);
}

fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. Update flags in SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const flagUpdates = {
    'nongzhigao': '邕',
    'yang_aner': '登',
    'deshou': '信',
    'chendiaoyan': '漳',
    'ouyue': '台',
    'yezongliu': '处',
    'huang_tianzhou': '田',
    'zhe_d': '折',
    'shen': '金',
    'panyao': '贺'
};

for (const [factionId, flag] of Object.entries(flagUpdates)) {
    const regex = new RegExp(`['"\`]${factionId}['"\`]\\s*:\\s*['"\`][^'"\`]+['"\`]`, 'g');
    if (sdnStr.match(regex)) {
        sdnStr = sdnStr.replace(regex, `'${factionId}': '${flag}'`);
    } else {
        console.log(`Warning: ${factionId} not found in SandboxDisplayNames`);
    }
}

fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

// 3. Update flags in CityAssetManager.ts (factionFlagMap)
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');

for (const [factionId, flag] of Object.entries(flagUpdates)) {
    const regex = new RegExp(`['"\`]${factionId}['"\`]\\s*:\\s*['"\`][^'"\`]+['"\`]`, 'g');
    if (camStr.match(regex)) {
        camStr = camStr.replace(regex, `'${factionId}': '${flag}'`);
    }
}

fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

console.log('Successfully applied 3rd batch of city renames and flag updates!');
