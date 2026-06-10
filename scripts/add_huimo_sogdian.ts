import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const newLuotong = `    {
        id: 'city_luotong',
        name: '罗通山城',
        factionId: 'huimo',
        lat: 42.3458, lng: 125.7512,
        type: 'fort',
        troops: 10000,
        tier: 2,
        note: '濊貊/高句丽防御系数极高的纯军事山城，抵御中原王朝与游牧民族的战略大本营'
    }`;

const newVaraksha = `    {
        id: 'city_varaksha',
        name: '瓦拉赫沙遗址',
        factionId: 'sogdian',
        lat: 40.1892, lng: 64.1761,
        type: 'fort',
        troops: 15000,
        tier: 1,
        note: '粟特本土布哈拉统治者的皇家要塞与避暑行宫，出土著名粟特艺术“红厅壁画”'
    }`;

const lastBracketIdx = content.lastIndexOf('];');
if (lastBracketIdx !== -1) {
    let parts = content.substring(0, lastBracketIdx).trim();
    if (!parts.endsWith(',')) {
        parts += ',';
    }
    content = parts + '\n' + newLuotong + ',\n' + newVaraksha + '\n];\n';
    fs.writeFileSync(file, content);
    console.log('Added Luotong and Varaksha successfully.');
} else {
    console.log('Could not find end of array.');
}
