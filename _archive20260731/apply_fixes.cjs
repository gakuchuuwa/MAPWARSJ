const fs = require('fs');
const path = require('path');
const dataDir = './src/data';

function replaceInFile(file, replacements) {
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    let modified = false;
    for (const [from, to] of replacements) {
        if (content.match(from)) {
            content = content.replace(from, to);
            modified = true;
        } else {
            // console.warn(`Warning: Could not find match for ${from} in ${file}`);
        }
    }
    if (modified) fs.writeFileSync(filePath, content);
}

// 1. factions.ts
replaceInFile('factions.ts', [
    [/{ id: 'jiujiang', name: '柴桑' }/, "{ id: 'jiujiang', name: '江州' }"],
    [/{ id: 'zaoyang_d', name: '枣阳' }/, "{ id: 'zaoyang_d', name: '唐州' }"],
    [/{ id: 'kang', name: '长泽' }/, "{ id: 'kang', name: '夏州' }"],
    [/{ id: 'niang', name: '觉木宗' }/, "{ id: 'niang', name: '琼结' }"],
    [/{ id: 'qiong', name: '邛都' }/, "{ id: 'qiong', name: '邛人' }"]
]);

// 2. SandboxDisplayNames.ts
replaceInFile('SandboxDisplayNames.ts', [
    [/'jiujiang': '柴桑',/, "'jiujiang': '江',"],
    [/'zaoyang_d': '枣阳',/, "'zaoyang_d': '孟',"],
    [/'kang': '长泽',/, "'kang': '夏',"],
    [/'wuzhumuqin': '乌珠穆沁',/, "'wuzhumuqin': '乌珠',"],
    [/'niang': '觉木宗',/, "'niang': '琼结',"],
    [/'qiong': '邛都',/, "'qiong': '邛',"]
]);

// 3. cities_v2.ts
replaceInFile('cities_v2.ts', [
    [/name: '乌珠穆沁', factionId: 'wuzhumuqin',/, "name: '古尔班赛堪', factionId: 'wuzhumuqin',"]
]);

// 4. Legions files
const legionsFiles = fs.readdirSync(dataDir).filter(f => f.includes('Legions.ts'));
for (const file of legionsFiles) {
    replaceInFile(file, [
        [/jiujiang: { name: '九江锐卒', tier: 2 },/, "jiujiang: { name: '蒙冲斗舰', tier: 1 },"],
        [/kang: { name: '梁国鹰扬', tier: 2 },/, "kang: { name: '鹰扬骁骑', tier: 2 },"],
        [/wuzhumuqin: { name: '乌珠穆沁骑', tier: 2 },/, "wuzhumuqin: { name: '赛堪轻骑', tier: 2 },"],
        [/niang: { name: '觉木宗戍军', tier: 2 },/, "niang: { name: '琼结卫', tier: 2 },"],
        [/qiong: { name: '邛都夷兵', tier: 3 },/, "qiong: { name: '邛谷锐骑', tier: 2 },"]
    ]);
}

console.log('Batch update completed.');
