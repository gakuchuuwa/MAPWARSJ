const fs = require('fs');

// 1. Add Yan'an to factions.ts
let f = fs.readFileSync('src/data/factions.ts', 'utf-8');
if (!f.includes("'yanan'")) {
    f = f.replace(/export const FACTIONS: Faction\[\] = \[/, "export const FACTIONS: Faction[] = [\n    { id: 'yanan', name: '延安', color: '#cc3333' },");
    fs.writeFileSync('src/data/factions.ts', f);
}

// 2. Add Yan'an to cities_v2.ts and fix Weihaiwei
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
if (!c.includes("'city_yanan'")) {
    c = c.replace(/export const CITIES_V2: City\[\] = \[/, "export const CITIES_V2: City[] = [\n    {\n        id: 'city_yanan', name: '延安', factionId: 'yanan',\n        lat: 36.6, lng: 109.5, type: 'medium_city',\n        note: '延安（肤施），陕北重镇，历代边防要地'\n    },");
}
c = c.replace(/id:\s*'city_weihaiwei'[\s\S]*?type:\s*'pass'/, match => match.replace("'pass'", "'medium_city'"));
fs.writeFileSync('src/data/cities_v2.ts', c);

// 3. Add Yan'an to GameApp.ts
let g = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
if (!g.includes("'yanan': 'city_yanan'")) {
    g = g.replace(/export const STARTING_CAPITALS: Record<string, string> = \{/, "export const STARTING_CAPITALS: Record<string, string> = {\n    'yanan': 'city_yanan',");
    fs.writeFileSync('src/app/GameApp.ts', g);
}

// 4. Add Yan'an to CityAssetManager.ts
let a = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8');
if (!a.includes("'yanan': '延'")) {
    a = a.replace(/const factionFlagMap: Record<string, string> = \{/, "const factionFlagMap: Record<string, string> = {\n    'yanan': '延',");
    fs.writeFileSync('src/assets/CityAssetManager.ts', a);
}

// 5. Add Yan'an to SandboxDisplayNames.ts
let s = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf-8');
if (!s.includes("yanan: '延安'")) {
    s = s.replace(/export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{/, "export const SANDBOX_DISPLAY_NAMES: Record<string, string> = {\n    yanan: '延安',");
    fs.writeFileSync('src/data/SandboxDisplayNames.ts', s);
}

console.log("Yan'an added and Weihaiwei type fixed to medium_city.");
