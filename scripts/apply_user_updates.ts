import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Yinchuan to Xingqing for Tangut
const yinchuanRegex = /\{\s*id:\s*['"]city_yinchuan['"],\s*name:\s*['"]银川['"],\s*factionId:\s*['"]panjun['"],\s*lat:\s*38\.48,\s*lng:\s*106\.23,\s*type:\s*['"]medium_city['"],\s*troops:\s*10000,\s*tier:\s*1\s*\}/;

const newXingqing = `{ id: 'city_xingqing', name: '兴庆', factionId: 'dangxiang', lat: 38.48, lng: 106.23, type: 'large_city', troops: 15000, tier: 1, note: '西夏国都(兴庆府)，党项族核心' }`;

if (content.match(yinchuanRegex)) {
    content = content.replace(yinchuanRegex, newXingqing);
    console.log('Updated Yinchuan to Xingqing for Tangut.');
} else {
    console.log('Could not find Yinchuan.');
}

// 2. Delete Jiaozhi
const jiaozhiRegex = /\{\s*id:\s*['"]city_jiaozhi['"][^\}]+\},?/;
if (content.match(jiaozhiRegex)) {
    content = content.replace(jiaozhiRegex, '');
    console.log('Deleted Jiaozhi.');
} else {
    console.log('Could not find Jiaozhi.');
}

// 3. Prepare additions: Shenglong and Boduo
const newShenglong = `    {
        id: 'city_shenglong',
        name: '昇龙',
        factionId: 'dayue',
        lat: 21.03, lng: 105.85,
        type: 'large_city',
        troops: 20000,
        tier: 1,
        note: '大越国都，历代安南政权核心'
    }`;

const newBoduo = `    {
        id: 'city_boduo',
        name: '伯都古城',
        factionId: 'wuji',
        lat: 45.201, lng: 124.775,
        type: 'medium_city',
        troops: 12000,
        tier: 2,
        note: '勿吉七部之伯咄部大本营，击败夫余后的西线核心堡寨，后演变为辽代宁江州'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newShenglong + ',\n' + newBoduo + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Added Shenglong and Boduo successfully.');
} else {
    console.log('Could not find end of array.');
}
