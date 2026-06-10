import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const newCity = `    {
        id: 'city_asuka',
        name: '飞鸟宫殿遗址群',
        factionId: 'yamato',
        lat: 34.472944, lng: 135.820278,
        type: 'large_city',
        troops: 25000,
        tier: 1,
        note: '6世纪末至7世纪大和政权的绝对政治中心，大化改新策源地，律令制国家大本营'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newCity + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Added Asuka successfully.');
} else {
    console.log('Could not find end of array.');
}
