const fs = require('fs');
const fgContent = fs.readFileSync('src/data/FactionGenerals.ts', 'utf-8');
const citiesContent = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const cityFactions = new Set();
const cityRegex = /factionId:\s*'([^']+)'/g;
let m;
while ((m = cityRegex.exec(citiesContent)) !== null) {
    cityFactions.add(m[1]);
}

const lines = fgContent.split('\n');
const targetNames = ['胡奢魔犬', '绛曲坚赞', '刘隐', '安邦彦', '朱元璋', '杨坚', '李之芳', '周迪'];

for (const name of targetNames) {
    const idx = lines.findIndex(l => l.includes("'" + name + "'"));
    if (idx !== -1) {
        const idMatch = lines[idx].match(/generalId:\s*'([^']+)'/);
        if (idMatch) {
            const genId = idMatch[1];
            let foundFac = [...cityFactions].find(f => genId.startsWith(f + '_'));
            console.log(name, '-> ID:', genId, '-> Faction:', foundFac || 'NONE/UNKNOWN', '-> Has City:', foundFac ? 'YES' : 'NO');
        }
    } else {
        console.log(name, '-> Not found in FactionGenerals.ts');
    }
}
