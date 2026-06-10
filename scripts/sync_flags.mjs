import fs from 'fs';

// 读取两个文件
let assetManager = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const displayNames = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');

const missingFactions = ['lulin', 'yunzhong', 'qian', 'chunshen', 'wan', 'qingyuan_bd', 'zhong', 'xichu', 'huangfu', 'guo', 'zi', 'jing2', 'long2', 'song2', 'qing', 'ting', 'quan', 'pingyuan', 'lu', 'xuan', 'yiwu', 'yutian', 'ning', 'machu', 'weiwuer', 'gumo', 'wensu', 'yutou', 'keerqin', 'xiangxiong', 'qingqiang', 'zhaowu', 'mangbu', 'gaoliang', 'ruoqiang', 'qiemo', 'purang', 'weitou', 'dangchang', 'hai2'];

const flagEntries = [];

for (const f of missingFactions) {
    // 从 SandboxDisplayNames 中精确提取出用户设定好的 1-2 个字的短名
    const regex = new RegExp(`['"\`]${f}['"\`]\\s*:\\s*['"\`]([^'"\`]+)['"\`]`);
    const match = displayNames.match(regex);
    if (match) {
        flagEntries.push(`        '${f}': '${match[1]}',`);
    } else {
        flagEntries.push(`        '${f}': 'X',`);
    }
}

// 插入到 factionFlagMap 中
assetManager = assetManager.replace(/(public\s+static\s+readonly\s+factionFlagMap\s*:\s*\{\s*\[key:\s*string\]\s*:\s*string\s*\}\s*=\s*\{[\s\S]*?)(\s*\})/, (match, p1, p2) => {
    return p1 + "\n" + flagEntries.join("\n") + p2;
});

fs.writeFileSync('src/assets/CityAssetManager.ts', assetManager);
console.log('Successfully synced factionFlagMap with SandboxDisplayNames');
