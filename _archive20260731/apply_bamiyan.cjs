const fs = require('fs');
const path = require('path');
const dataDir = './src/data';

function replaceInFile(file, replacements) {
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    for (const [from, to] of replacements) {
        if (content.match(from) || content.includes(from)) {
            content = content.replace(from, to);
            modified = true;
        }
    }
    if (modified) fs.writeFileSync(filePath, content);
}

// 1. SandboxDisplayNames.ts
replaceInFile('SandboxDisplayNames.ts', [
    [/'fanyanna': '梵衍那',/, "'fanyanna': '梵衍',"]
]);

// 2. cities_v2.ts
replaceInFile('cities_v2.ts', [
    [/name: '梵衍那', factionId: 'fanyanna',/, "name: '巴米扬', factionId: 'fanyanna',"]
]);

console.log('Update for fanyanna completed.');
