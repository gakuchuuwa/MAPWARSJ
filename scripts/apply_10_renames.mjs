import fs from 'fs';

// 1. Rename the 10 cities in cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');

const cityUpdates = [
    { oldName: '泾州', newName: '安定' },
    { oldName: '江州', newName: '重庆' },
    { oldName: '简州', newName: '阳安' },
    { oldName: '绛州', newName: '正平' },
    { oldName: '徐州', newName: '彭城' },
    { oldName: '福州', newName: '长乐府' },
    { oldName: '陈州', newName: '宛丘' },
    { oldName: '扬州', newName: '广陵' },
    { oldName: '随州', newName: '汉东' },
    { oldName: '常州', newName: '延陵' },
];

for (const update of cityUpdates) {
    const regex = new RegExp(`name:\\s*['"]${update.oldName}['"]`, 'g');
    citiesStr = citiesStr.replace(regex, `name: '${update.newName}'`);
}

fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. Update flags in SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const flagUpdates = {
    'huangfu': '泾', // 泾州 -> 安定, 旗号泾
    'ba': '巴',       // 江州 -> 重庆, 旗号巴
    'cheng': '简',    // 简州 -> 阳安, 旗号简
    'zhi_d': '绛',    // 绛州 -> 正平, 旗号绛
    'xichu': '西楚',  // 徐州 -> 彭城, 旗号西楚
    'min': '闽',      // 福州 -> 长乐府, 旗号闽
    'xie_cj_d': '陈', // 陈州 -> 宛丘, 旗号陈
    'hongguang': '弘光',// 扬州 -> 广陵, 旗号弘光
    'sui': '随',      // 随州 -> 汉东, 旗号随
    'zhangshicheng': '常' // 常州 -> 延陵, 旗号常
};

for (const [factionId, flag] of Object.entries(flagUpdates)) {
    const regex = new RegExp(`['"\`]${factionId}['"\`]\\s*:\\s*['"\`][^'"\`]+['"\`]`, 'g');
    if (sdnStr.match(regex)) {
        sdnStr = sdnStr.replace(regex, `'${factionId}': '${flag}'`);
    } else {
        // If it doesn't exist, we can't easily replace it here without breaking syntax, 
        // but they should exist since they are valid factions.
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

console.log('Successfully applied 10 city renames and flag updates!');
