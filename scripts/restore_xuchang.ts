import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const newXuchang = `    {
        id: 'city_xuchang',
        name: '许昌',
        factionId: 'xun_d',
        lat: 34.02, lng: 113.82,
        type: 'medium_city',
        troops: 10000,
        tier: 1,
        note: '曹魏都城/行都，荀氏核心，河南战略枢纽'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newXuchang + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Restored Xuchang successfully.');
} else {
    console.log('Could not find end of array.');
}