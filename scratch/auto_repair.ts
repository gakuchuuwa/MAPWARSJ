import * as fs from 'fs';

// Helper to replace text in a file
function updateFile(path: string, replacer: (content: string) => string) {
    const oldContent = fs.readFileSync(path, 'utf8');
    const newContent = replacer(oldContent);
    if (oldContent !== newContent) {
        fs.writeFileSync(path, newContent, 'utf8');
        console.log(`Updated ${path}`);
    } else {
        console.log(`No changes made to ${path}`);
    }
}

console.log('=== 自动修复脚本开始 ===');

// 1. Fix factions.ts duplicates and missing names
updateFile('c:\\MAPWARSJ\\src\\data\\factions.ts', content => {
    let result = content;
    
    // Fix 滇国 (dianguo)
    result = result.replace(
        /{ id: 'dianguo', name: '滇', color: '#999999' },/g,
        "{ id: 'dianguo', name: '滇国', color: '#999999' },"
    );
    
    // Fix 小刀会 (daming)
    result = result.replace(
        /{ id: 'daming', name: '大明', color: '#DC143C' },\s*\/\/\s*绯红\s*-\s*大明国\/小刀会/g,
        "{ id: 'daming', name: '小刀', color: '#DC143C' },                 // 绯红 - 大明国/小刀会"
    );

    // Fix 陇西李氏 (li_lx_d)
    result = result.replace(
        /{ id: 'li_lx_d', name: '李', color: '#8A2BE2' },\s*\/\/\s*陇西紫\s*-\s*陇西李氏/g,
        "{ id: 'li_lx_d', name: '陇西', color: '#8A2BE2' },                  // 陇西紫 - 陇西李氏"
    );

    // Fix 彭氏 (pengshi)
    result = result.replace(
        /{ id: 'pengshi', name: '彭', color: '#999999' },/g,
        "{ id: 'pengshi', name: '彭氏', color: '#999999' },"
    );

    // Fix 焉耆 (yanqi)
    result = result.replace(
        /{ id: 'yanqi', name: '龙', color: '#999999' },/g,
        "{ id: 'yanqi', name: '焉耆', color: '#999999' },"
    );

    // Fix 浙方 (fang_guozhen)
    result = result.replace(
        /{ id: 'fang_guozhen', name: '方', color: '#1E90FF' },/g,
        "{ id: 'fang_guozhen', name: '浙方', color: '#1E90FF' },"
    );

    // Fix 于阗 (yutian)
    result = result.replace(
        /{ id: 'yutian', name: '尉迟', color: '#999999' },/g,
        "{ id: 'yutian', name: '于阗', color: '#999999' },"
    );

    // Fix 黎国 (liguo)
    result = result.replace(
        /{ id: 'liguo', name: '黎', color: '#999999' },/g,
        "{ id: 'liguo', name: '黎国', color: '#999999' },"
    );

    // Fix 德格 (gar_kham)
    result = result.replace(
        /{ id: 'gar_kham', name: '康巴', color: '#4B0082' },/g,
        "{ id: 'gar_kham', name: '德格', color: '#4B0082' },"
    );

    // Fix 卓氏 (zhuoshi) - the sandbox mismatch showed Sandbox="卓" vs Faction="卓" (no wait, Sandbox="卓氏" vs Faction="卓"?)
    // Actually we'll auto-sync SandboxDisplayNames later.

    // 解决 missing hai2 的问题：给 factions 增加 hai2
    if (!result.includes("'hai2'")) {
        result = result.replace(
            /];\s*$/g,
            "    { id: 'hai2', name: '海州', color: '#999999' },\n];\n"
        );
    }

    return result;
});

// Run a sync script to sync all 3 files
const runSync = `
import { FACTIONS } from '../src/data/factions';
import { CITIES_V2 } from '../src/data/cities_v2';
import * as fs from 'fs';

const usedFactionIds = new Set<string>();
CITIES_V2.forEach(c => {
    if (c.factionId && c.factionId !== 'panjun') {
        usedFactionIds.add(c.factionId);
    }
});

const factionMap = new Map(FACTIONS.map(f => [f.id, f.name]));

// 1. Sync SandboxDisplayNames
const sandboxPath = 'c:\\\\MAPWARSJ\\\\src\\\\data\\\\SandboxDisplayNames.ts';
let sandboxContent = fs.readFileSync(sandboxPath, 'utf8');
usedFactionIds.forEach(id => {
    const name = factionMap.get(id);
    if (!name) return;
    const regex = new RegExp(\`'\\$\\{id\\}':\\s*'.*?'\`);
    if (sandboxContent.match(regex)) {
        sandboxContent = sandboxContent.replace(regex, \`'\${id}': '\${name}'\`);
    } else {
        sandboxContent = sandboxContent.replace(/};\s*$/, \`    '\${id}': '\${name}',\\n};\n\`);
    }
});
fs.writeFileSync(sandboxPath, sandboxContent, 'utf8');

// 2. Sync GameApp.ts
const gameAppPath = 'c:\\\\MAPWARSJ\\\\src\\\\core\\\\GameApp.ts';
let gameAppContent = fs.readFileSync(gameAppPath, 'utf8');
usedFactionIds.forEach(id => {
    if (!gameAppContent.includes(\`'\${id}':\`)) {
        const city = CITIES_V2.find(c => c.factionId === id);
        if (city) {
            gameAppContent = gameAppContent.replace(/};\s*\\n\\s*export class GameApp/, \`    '\${id}': '\${city.id}',\\n};\\n\\nexport class GameApp\`);
        }
    }
});
fs.writeFileSync(gameAppPath, gameAppContent, 'utf8');

// 3. Sync CityAssetManager.ts
const assetMgrPath = 'c:\\\\MAPWARSJ\\\\src\\\\core\\\\CityAssetManager.ts';
let assetMgrContent = fs.readFileSync(assetMgrPath, 'utf8');
usedFactionIds.forEach(id => {
    const name = factionMap.get(id);
    if (!name) return;
    if (!assetMgrContent.includes(\`'\${id}':\`)) {
        assetMgrContent = assetMgrContent.replace(/};\s*\\n\\s*\\/\\/ If the factionId represents one of the Seven Warring States/, \`    '\${id}': '\${name}',\\n        };\\n\\n        // If the factionId represents one of the Seven Warring States\`);
    } else {
        // Also fix the text in CityAssetManager if it's wrong (e.g. for duplicates we just renamed)
        const regex = new RegExp(\`'\\$\\{id\\}':\\s*'.*?'\`);
        assetMgrContent = assetMgrContent.replace(regex, \`'\${id}': '\${name}'\`);
    }
});
fs.writeFileSync(assetMgrPath, assetMgrContent, 'utf8');
console.log('=== 三大文件同步完成 ===');
`;
fs.writeFileSync('c:\\MAPWARSJ\\scratch\\sync_all.ts', runSync, 'utf8');
