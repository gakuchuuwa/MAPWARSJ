const fs = require('fs');

// 1. factions.ts
let f = fs.readFileSync('src/data/factions.ts', 'utf-8');
if (!f.includes("'weihaiwei'")) {
    f = f.replace(/export const FACTIONS: Faction\[\] = \[/, "export const FACTIONS: Faction[] = [\n    { id: 'weihaiwei', name: '威海卫', color: '#4a7c59' },");
    fs.writeFileSync('src/data/factions.ts', f);
}

// 2. cities_v2.ts
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
if (!c.includes("'city_weihaiwei'")) {
    c = c.replace(/export const CITIES_V2: City\[\] = \[/, "export const CITIES_V2: City[] = [\n    {\n        id: 'city_weihaiwei', name: '威海卫', factionId: 'weihaiwei',\n        lat: 37.51, lng: 122.12, type: 'pass',\n        note: '威海卫，明清海防重镇，北洋水师基地'\n    },");
    fs.writeFileSync('src/data/cities_v2.ts', c);
}

// 3. GameApp.ts
let g = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
if (!g.includes("'weihaiwei': 'city_weihaiwei'")) {
    g = g.replace(/export const STARTING_CAPITALS: Record<string, string> = \{/, "export const STARTING_CAPITALS: Record<string, string> = {\n    'weihaiwei': 'city_weihaiwei',");
    fs.writeFileSync('src/app/GameApp.ts', g);
}

// 4. CityAssetManager.ts
let a = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8');
if (!a.includes("'weihaiwei': '威'")) {
    a = a.replace(/const factionFlagMap: Record<string, string> = \{/, "const factionFlagMap: Record<string, string> = {\n    'weihaiwei': '威',");
    fs.writeFileSync('src/assets/CityAssetManager.ts', a);
}

// 5. SandboxDisplayNames.ts
let s = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf-8');
if (!s.includes("weihaiwei: '威海卫'")) {
    s = s.replace(/export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{/, "export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {\n    weihaiwei: '威海卫',");
    fs.writeFileSync('src/data/SandboxDisplayNames.ts', s);
}

console.log("Added weihaiwei to all 5 files.");
