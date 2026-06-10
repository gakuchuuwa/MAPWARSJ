import * as fs from 'fs';

const filePath = 'c:\\MAPWARSJ\\src\\data\\cities_v2.ts';
let content = fs.readFileSync(filePath, 'utf8');

const updates = [
    {
        id: 'city_xiangyang',
        note: '古称襄阳，荆楚咽喉，汉水流域之政治军事重镇，刘表荆州治所'
    },
    {
        id: 'city_jiangxia',
        note: '古称江夏(今武汉一带)，扼守长江中游与汉水交汇处，历代兵家必争之地'
    },
    {
        id: 'city_wancheng',
        note: '古称皖城/庐江，扼守长江下游北岸，三国时期孙吴与曹魏反复争夺之重镇'
    },
    {
        id: 'city_hongzhou',
        note: '古称豫章/洪州(今江西南昌)，襟三江而带五湖，江南西道之核心大邑'
    },
    {
        id: 'city_changsha',
        note: '古称长沙/潭州，五代十国马楚政权都城，湘江流域之政治经济中心'
    }
];

updates.forEach(update => {
    // We look for the object with id: '...' and update/add the note field
    const regex = new RegExp(`(id:\\s*'${update.id}'[\\s\\S]*?type:\\s*'medium_city'[\\s\\S]*?tier:\\s*\\d+,?)([\\s\\S]*?)(note:\\s*'.*?'\\s*)?(})`);
    content = content.replace(regex, (match, p1, p2, p3, p4) => {
        // If note exists, replace it, otherwise add it
        const newNote = `\n        note: '${update.note}'\n    `;
        return `${p1}${newNote}${p4}`;
    });
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Notes updated successfully.');
