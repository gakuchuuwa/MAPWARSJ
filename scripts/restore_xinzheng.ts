import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const xinzhengStr = `    {
        id: 'city_xinzheng',
        name: '新郑',
        factionId: 'han',
        lat: 34.39, lng: 113.73,
        type: 'large_city',
        troops: 20000,
        tier: 0,
        note: '古华夏九州之豫州, 战国时期韩国国都, 十大古都之一'
    }`;

// Find the last `];` and insert it before that
const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + xinzhengStr + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Restored Xinzheng successfully.');
} else {
    console.log('Could not find end of array.');
}