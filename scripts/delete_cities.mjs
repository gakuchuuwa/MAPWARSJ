import fs from 'fs';

// 1. Delete from cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
citiesStr = citiesStr.replace(/\s*\{[^}]*id:\s*['"]city_juandu['"][^}]*\}[,;]?/, '');
citiesStr = citiesStr.replace(/\s*\{[^}]*id:\s*['"]city_luotong['"][^}]*\}[,;]?/, '');
fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. Delete from factions.ts
let factionsStr = fs.readFileSync('src/data/factions.ts', 'utf8');
factionsStr = factionsStr.replace(/\s*\{[^}]*id:\s*['"]juandu['"][^}]*\}[,;]?/, '');
factionsStr = factionsStr.replace(/\s*\{[^}]*id:\s*['"]fuca['"][^}]*\}[,;]?/, '');
fs.writeFileSync('src/data/factions.ts', factionsStr);

// 3. Delete from GameApp.ts
let gameAppStr = fs.readFileSync('src/app/GameApp.ts', 'utf8');
gameAppStr = gameAppStr.replace(/\s*['"]juandu['"]\s*:\s*['"][^'"]+['"][,;]?/, '');
gameAppStr = gameAppStr.replace(/\s*['"]fuca['"]\s*:\s*['"][^'"]+['"][,;]?/, '');
fs.writeFileSync('src/app/GameApp.ts', gameAppStr);

// 4. Delete from CityAssetManager.ts
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
camStr = camStr.replace(/\s*['"]juandu['"]\s*:\s*['"][^'"]+['"][,;]?/, '');
camStr = camStr.replace(/\s*['"]fuca['"]\s*:\s*['"][^'"]+['"][,;]?/, '');
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

// 5. Delete from SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
sdnStr = sdnStr.replace(/\s*['"]juandu['"]\s*:\s*['"][^'"]+['"][,;]?/, '');
sdnStr = sdnStr.replace(/\s*['"]fuca['"]\s*:\s*['"][^'"]+['"][,;]?/, '');
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

console.log('Successfully deleted cities and factions!');
