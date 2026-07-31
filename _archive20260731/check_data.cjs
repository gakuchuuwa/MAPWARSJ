const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const objMatch = content.match(/id:\s*'city_[^']+'/g);
if (objMatch) {
    const ids = objMatch.map(m => m.split("'")[1]);
    const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
    console.log('Duplicate cities:', duplicates);
} else {
    console.log('No matches');
}

const factionMatch = content.match(/factionId:\s*'[^']+'/g);
if (factionMatch) {
    const fids = factionMatch.map(m => m.split("'")[1]);
    const uniqueFids = [...new Set(fids)];
    
    // check if all fids exist in factions.ts
    const factionsContent = fs.readFileSync('src/data/factions.ts', 'utf-8');
    const missingInFactions = uniqueFids.filter(f => !factionsContent.includes(`id: '${f}'`) && f !== 'panjun');
    console.log('Factions in cities not in factions.ts:', missingInFactions);
}
