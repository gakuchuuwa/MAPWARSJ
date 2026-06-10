import fs from 'fs';

// 1 & 2. Fix GameApp.ts STARTING_CAPITALS
let gameApp = fs.readFileSync('src/app/GameApp.ts', 'utf8');

// Find cities for missing factions
const citiesV2 = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const factionsToAdd = ['xinping', 'huan', 'wei2', 'lingwu'];
const newEntries = [];
for (const f of factionsToAdd) {
    const regex = new RegExp(`id:\\s*['"\`]?([a-zA-Z0-9_]+)['"\`]?,[\\s\\S]*?factionId:\\s*['"\`]${f}['"\`]`);
    const match = citiesV2.match(regex);
    if (match) {
        newEntries.push(`    '${f}': '${match[1]}',`);
    }
}

// Remove missing cities
const factionsToRemove = ['wusangui', 'huimin', 'xin2'];
let updatedGameApp = gameApp;
for (const f of factionsToRemove) {
    const regex = new RegExp(`\\s*['"\`]${f}['"\`]\\s*:\\s*['"\`].*?['"\`],?`, 'g');
    updatedGameApp = updatedGameApp.replace(regex, '');
}

// Add new ones right before the closing brace of STARTING_CAPITALS
updatedGameApp = updatedGameApp.replace(/(export\s+const\s+STARTING_CAPITALS\s*:\s*Record<string,\s*string>\s*=\s*\{[\s\S]*?)(\s*\})/, (match, p1, p2) => {
    return p1 + "\n" + newEntries.join("\n") + p2;
});

fs.writeFileSync('src/app/GameApp.ts', updatedGameApp);

// 3. Fix CityAssetManager.ts factionFlagMap
let assetManager = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const missingFactions = ['lulin', 'yunzhong', 'qian', 'chunshen', 'wan', 'qingyuan_bd', 'zhong', 'xichu', 'huangfu', 'guo', 'zi', 'jing2', 'long2', 'song2', 'qing', 'ting', 'quan', 'pingyuan', 'lu', 'xuan', 'yiwu', 'yutian', 'ning', 'machu', 'weiwuer', 'gumo', 'wensu', 'yutou', 'keerqin', 'xiangxiong', 'qingqiang', 'zhaowu', 'mangbu', 'gaoliang', 'ruoqiang', 'qiemo', 'purang', 'weitou', 'dangchang', 'hai2'];
const factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');

const flagEntries = [];
for (const f of missingFactions) {
    const regex = new RegExp(`id:\\s*['"\`]${f}['"\`]?,\\s*name:\\s*['"\`]([^'"\`]+)['"\`]`);
    const match = factionsStr.match(regex);
    if (match) {
        flagEntries.push(`    '${f}': '${match[1].charAt(0)}',`);
    } else {
        flagEntries.push(`    '${f}': 'X',`);
    }
}

assetManager = assetManager.replace(/(export\s+const\s+factionFlagMap\s*:\s*Record<string,\s*string>\s*=\s*\{[\s\S]*?)(\s*\})/, (match, p1, p2) => {
    return p1 + "\n" + flagEntries.join("\n") + p2;
});

fs.writeFileSync('src/assets/CityAssetManager.ts', assetManager);

console.log('Fixed GameApp.ts and CityAssetManager.ts');
