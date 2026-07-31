const fs = require('fs');
const lines = fs.readFileSync('c:/MAPWARSJ/src/data/factions.ts', 'utf8').split('\n');
const ids = ['xuantu','joseon','gaogouli','goryeo','woju','jingcheng_d','chungju_d','naju_d','zhen','sambyeol','sheng_d','gaya','xinluo','hai2','xingliao','tunggiya','dingan','baiji','huimo','sabeol','lelang','danluo','donghui','chen3','hui'];
ids.forEach(id => {
    const fLine = lines.find(l => l.includes(`id: '${id}'`));
    const fNameMatch = fLine ? fLine.match(/name:\s*['"]([^'"]+)['"]/) : null;
    console.log(`${id}: ${fNameMatch ? fNameMatch[1] : 'Unknown'}`);
});
