import fs from 'fs';

const factionsToDelete = [
    'zheng_xy_d', 'shanrong', 'su_d', 'yiqu', 'duan_d', 'nanyue',
    'nanhan', 'pingcheng', 'luhun', 'yeli', 'liuwuzhou', 'luoyi',
    'changmen', 'shenli', 'wuman', 'nanqiao'
];

// 1. Update cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
// Change factionId to 'panjun' for these factions
for (const fid of factionsToDelete) {
    const regex = new RegExp(`factionId:\\s*['"]${fid}['"]`, 'g');
    citiesStr = citiesStr.replace(regex, `factionId: 'panjun'`);
}
// Special case: Rename 平城 back to 武州塞
citiesStr = citiesStr.replace(
    /\{\s*id:\s*['"]city_wuzhousai['"],\s*name:\s*['"]平城['"]/,
    `{ id: 'city_wuzhousai', name: '武州塞'`
);
fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// Helper function to remove a line containing a faction
function removeFromStr(str, fid) {
    // This matches a line that contains the exact faction id in quotes.
    const regex = new RegExp(`^.*['"\`]${fid}['"\`].*\r?\n`, 'gm');
    return str.replace(regex, '');
}

// 2. Delete from factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
for (const fid of factionsToDelete) {
    const regex = new RegExp(`\\s*\\{[^}]*id:\\s*['"]${fid}['"][^}]*\\}[,;]?`, 'g');
    factionsStr = factionsStr.replace(regex, '');
}
fs.writeFileSync('src/data/factions.ts', factionsStr);

// 3. Delete from GameApp.ts
let gameAppStr = fs.readFileSync('src/app/GameApp.ts', 'utf8');
for (const fid of factionsToDelete) {
    gameAppStr = removeFromStr(gameAppStr, fid);
}
fs.writeFileSync('src/app/GameApp.ts', gameAppStr);

// 4. Delete from CityAssetManager.ts
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
for (const fid of factionsToDelete) {
    camStr = removeFromStr(camStr, fid);
}
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

// 5. Delete from SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
for (const fid of factionsToDelete) {
    sdnStr = removeFromStr(sdnStr, fid);
}
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

console.log('Successfully assigned passes to panjun and deleted factions!');
