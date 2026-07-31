const fs = require('fs');

// 1. Update cities_v2.ts
let c = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');

// Rename Yan'an to Fushi
c = c.replace(/'city_yanan'/g, "'city_fushi'");
c = c.replace(/factionId:\s*'yanan'/g, "factionId: 'fushi'");
c = c.replace(/name:\s*'延安'/g, "name: '肤施'");

// Add 【界城】 to the note of the 7 anchor cities
const anchors = ['肤施', '归化城', '襄平', '威海卫', '扬州', '汉中', '天水'];
const lines = c.split('\n');
let inTargetCity = false;
let currentCity = '';
for (let i = 0; i < lines.length; i++) {
    for (const a of anchors) {
        if (lines[i].includes(`name: '${a}'`)) {
            inTargetCity = true;
            currentCity = a;
            break;
        }
    }
    
    if (inTargetCity) {
        if (lines[i].includes('note:')) {
            if (!lines[i].includes('【界城】')) {
                lines[i] = lines[i].replace(/note:\s*'/, "note: '【界城】");
            }
            inTargetCity = false;
        } else if (lines[i].includes('}') || lines[i].includes(']')) {
            // If the city object ends and no note was found, we add one
            lines[i] = `        note: '【界城】${currentCity}作为区域核心边界点',\n` + lines[i];
            inTargetCity = false;
        }
    }
}
fs.writeFileSync('src/data/cities_v2.ts', lines.join('\n'));

// 2. Update factions.ts
let f = fs.readFileSync('src/data/factions.ts', 'utf-8');
f = f.replace(/'yanan'/g, "'fushi'");
f = f.replace(/name:\s*'延安'/g, "name: '肤施'");
fs.writeFileSync('src/data/factions.ts', f);

// 3. Update GameApp.ts
let g = fs.readFileSync('src/app/GameApp.ts', 'utf-8');
g = g.replace(/'yanan':\s*'city_yanan'/g, "'fushi': 'city_fushi'");
fs.writeFileSync('src/app/GameApp.ts', g);

// 4. Update CityAssetManager.ts
let a = fs.readFileSync('src/assets/CityAssetManager.ts', 'utf-8');
a = a.replace(/'yanan':\s*'延'/g, "'fushi': '肤'");
fs.writeFileSync('src/assets/CityAssetManager.ts', a);

// 5. Update SandboxDisplayNames.ts
let s = fs.readFileSync('src/data/SandboxDisplayNames.ts', 'utf-8');
s = s.replace(/yanan:\s*'延安'/g, "fushi: '肤施'");
fs.writeFileSync('src/data/SandboxDisplayNames.ts', s);

// 6. Update RegionSystem.ts
let r = fs.readFileSync('src/systems/RegionSystem.ts', 'utf-8');
r = r.replace(/\/\/\s*延安/g, "// 肤施");
fs.writeFileSync('src/systems/RegionSystem.ts', r);

console.log("Renamed Yan'an to Fushi and added 【界城】 to 7 anchor cities.");
