import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const newCity = `    {
        id: 'city_dongkang',
        name: '东康遗址',
        factionId: 'sushen',
        lat: 44.5175, lng: 131.2917,
        type: 'small_city',
        troops: 8000,
        tier: 4,
        note: '团结文化(先秦至两汉)典型代表, 发掘大量肃慎族群特征的鬲与石砮, 印证了《左传》中肃慎人的半地穴老营渔猎生活风貌'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newCity + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Added Dongkang successfully.');
} else {
    console.log('Could not find end of array.');
}