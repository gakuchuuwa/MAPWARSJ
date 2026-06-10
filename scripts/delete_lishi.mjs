import fs from 'fs';

const fid = 'lishi';

// Helper function to remove a line containing a faction
function removeFromStr(str, fid) {
    const regex = new RegExp(`^.*['"\`]${fid}['"\`].*\r?\n`, 'gm');
    return str.replace(regex, '');
}

// 2. Delete from factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
const regex = new RegExp(`\\s*\\{[^}]*id:\\s*['"]${fid}['"][^}]*\\}[,;]?`, 'g');
factionsStr = factionsStr.replace(regex, '');
fs.writeFileSync('src/data/factions.ts', factionsStr);

// 3. Delete from GameApp.ts
let gameAppStr = fs.readFileSync('src/app/GameApp.ts', 'utf8');
gameAppStr = removeFromStr(gameAppStr, fid);
fs.writeFileSync('src/app/GameApp.ts', gameAppStr);

// 4. Delete from CityAssetManager.ts
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
camStr = removeFromStr(camStr, fid);
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

// 5. Delete from SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
sdnStr = removeFromStr(sdnStr, fid);
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

console.log('Successfully deleted orphaned faction lishi!');
