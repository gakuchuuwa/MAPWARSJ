const fs = require('fs');
let content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const lines = content.split('\n');

const toDelete = ['city_heishui_mohe', 'city_heishui', 'city_huoshe', 'city_yishangna'];
const newLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // 1. Delete cities
    let shouldDelete = false;
    for (const d of toDelete) {
        if (line.includes(`id: '${d}'`)) {
            shouldDelete = true;
            break;
        }
    }
    if (shouldDelete) continue;
    
    let newLine = line;
    
    // 2. Upgrade Angkor
    if (newLine.includes("id: 'city_angkor'")) {
        newLine = newLine.replace("type: 'small_city'", "type: 'big_city'").replace("troops: 5000", "troops: 20000");
    }
    
    // 3. Upgrade Dupan
    if (newLine.includes("id: 'city_dupan'")) {
        newLine = newLine.replace("type: 'small_city'", "type: 'medium_city'").replace("troops: 5000", "troops: 10000, tier: 1");
    }
    
    newLines.push(newLine);
}

fs.writeFileSync('src/data/cities_v2.ts', newLines.join('\n'), 'utf-8');
console.log('Restored deletions and upgrades!');
