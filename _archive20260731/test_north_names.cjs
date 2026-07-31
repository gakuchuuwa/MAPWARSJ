const fs = require('fs');
const lines = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
['tianxiong','huan','zhao','yingzhou_ying_d','chile','murong','shatuo','lingwu','wuhuan','helian','dada_ming'].forEach(id => {
    const fLine = lines.find(l => l.includes(`id: '${id}'`));
    const fNameMatch = fLine ? fLine.match(/name:\s*['"]([^'"]+)['"]/) : null;
    console.log(`${fNameMatch ? fNameMatch[1] : 'Unknown'} (${id})`);
});
