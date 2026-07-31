const fs = require('fs');
const lines = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
['qing','xianlingqiang','tufa_d','qifu_d','anding_wei'].forEach(id => {
    const fLine = lines.find(l => l.includes(`id: '${id}'`));
    const fNameMatch = fLine ? fLine.match(/name:\s*['"]([^'"]+)['"]/) : null;
    console.log(`${fNameMatch ? fNameMatch[1] : 'Unknown'} (${id})`);
});
