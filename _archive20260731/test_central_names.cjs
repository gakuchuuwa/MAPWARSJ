const fs = require('fs');
const lines = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
['han_d','sui','yiyang_d','huo','chuzhou_d'].forEach(id => {
    const fLine = lines.find(l => l.includes(`id: '${id}'`));
    const fNameMatch = fLine ? fLine.match(/name:\s*['"]([^'"]+)['"]/) : null;
    console.log(`${fNameMatch ? fNameMatch[1] : 'Unknown'} (${id})`);
});
