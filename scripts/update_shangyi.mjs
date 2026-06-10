import fs from 'fs';

// 1. Rename city in cities_v2.ts
let citiesStr = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
citiesStr = citiesStr.replace(
    /\{\s*id:\s*['"]city_shangluo['"],\s*name:\s*['"]上洛['"]/,
    `{ id: 'city_shangluo', name: '商邑'`
);
fs.writeFileSync('src/data/cities_v2.ts', citiesStr);

// 2. Update flag in SandboxDisplayNames.ts
let sdnStr = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf8');
const regexSdn = /['"]shangzhou['"]\s*:\s*['"][^'"]+['"]/;
if (sdnStr.match(regexSdn)) {
    sdnStr = sdnStr.replace(regexSdn, `'shangzhou': '上洛'`);
} else {
    sdnStr = sdnStr.replace(/(export const SANDBOX_DISPLAY_NAMES: Record<string, string> = \{)/, `$1\n    'shangzhou': '上洛',`);
}
fs.writeFileSync('src/data/SandboxDisplayNames.ts', sdnStr);

// 3. Update flag in CityAssetManager.ts
let camStr = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf8');
const regexCam = /['"]shangzhou['"]\s*:\s*['"][^'"]+['"]/;
if (camStr.match(regexCam)) {
    camStr = camStr.replace(regexCam, `'shangzhou': '上洛'`);
} else {
    camStr = camStr.replace(/(public static readonly factionFlagMap: \{ \[key: string\]: string \} = \{)/, `$1\n        'shangzhou': '上洛',`);
}
fs.writeFileSync('src/assets/CityAssetManager.ts', camStr);

console.log('Successfully updated Shangyi and its flag!');
