import fs from 'fs';
let assetManager = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const missingFactions = ['lulin', 'yunzhong', 'qian', 'chunshen', 'wan', 'qingyuan_bd', 'zhong', 'xichu', 'huangfu', 'guo', 'zi', 'jing2', 'long2', 'song2', 'qing', 'ting', 'quan', 'pingyuan', 'lu', 'xuan', 'yiwu', 'yutian', 'ning', 'machu', 'weiwuer', 'gumo', 'wensu', 'yutou', 'keerqin', 'xiangxiong', 'qingqiang', 'zhaowu', 'mangbu', 'gaoliang', 'ruoqiang', 'qiemo', 'purang', 'weitou', 'dangchang', 'hai2'];
const factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');

const flagEntries = [];
for (const f of missingFactions) {
    const regex = new RegExp(`id:\\s*['"\`]${f}['"\`]?,\\s*name:\\s*['"\`]([^'"\`]+)['"\`]`);
    const match = factionsStr.match(regex);
    if (match) {
        flagEntries.push(`        '${f}': '${match[1].charAt(0)}',`);
    } else {
        flagEntries.push(`        '${f}': 'X',`);
    }
}

assetManager = assetManager.replace(/(public\s+static\s+readonly\s+factionFlagMap\s*:\s*\{\s*\[key:\s*string\]\s*:\s*string\s*\}\s*=\s*\{[\s\S]*?)(\s*\})/, (match, p1, p2) => {
    return p1 + "\n" + flagEntries.join("\n") + p2;
});

fs.writeFileSync('src/assets/CityAssetManager.ts', assetManager);
console.log('Fixed CityAssetManager.ts');
