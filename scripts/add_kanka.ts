import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const newCity = `    {
        id: 'city_kanka',
        name: '康卡遗址',
        factionId: 'kangju',
        lat: 40.7244, lng: 69.0008,
        type: 'medium_city',
        troops: 15000,
        tier: 1,
        note: '汉代康居核心国都之一，锡尔河流域规模最大的中心城市，三重城墙与护城河，中亚帝国鼎盛时期的政治和军事核心'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newCity + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Added Kanka successfully.');
} else {
    console.log('Could not find end of array.');
}
