import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const newYuwen = `    {
        id: 'city_raoleshui',
        name: '饶乐水老营',
        factionId: 'yuwen',
        lat: 43.27, lng: 118.48,
        type: 'fort',
        troops: 15000,
        tier: 2,
        note: '宇文鲜卑早期依傍西拉木伦河的游牧根据地，由此积蓄南下争霸的元气'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newYuwen + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Added Raoleshui successfully.');
} else {
    console.log('Could not find end of array.');
}
