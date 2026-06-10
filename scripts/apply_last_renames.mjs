import fs from 'fs';

// 1. Rename cities in cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const cityUpdates = [
    { oldName: '矩州', newName: '顺元' },
    { oldName: '净州', newName: '净州塞' },
    { oldName: '辰州', newName: '沅陵' },
    { oldName: '沅州', newName: '芷江' },
    { oldName: '邠州', newName: '新平' },
    { oldName: '灵州', newName: '回乐' },
];

for (const update of cityUpdates) {
    const regex = new RegExp(`name:\\s*['"]${update.oldName}['"]`, 'g');
    citiesStr = citiesStr.replace(regex, `name: '${update.newName}'`);
}

fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. Update flags in SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const flagUpdates = {
    'qian': '矩',
    'ongut': '净',
    'pengshi': '辰',
    'qianzhong': '沅',
    'xinping': '邠',
    'lingwu': '灵'
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

console.log('Successfully applied last batch of city renames and flag updates!');
