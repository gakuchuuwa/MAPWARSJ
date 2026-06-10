import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const citiesToDelete = [
    'city_hailing',
    'city_songtingguan',
    'city_fengxiang',
    'city_dongzhiyuan',
    'city_shinotachi',
    'city_muye',
    'city_suqian',
    'city_mayi',
    'city_shuofang',
    'city_yijing',
    'city_bazhou',
    'city_mengcheng',
    'city_danjiang',
    'city_kaili',
    'city_dayaoshan'
];

let deletedCount = 0;
for (const id of citiesToDelete) {
    // Regex matching { id: 'city_hailing', ... }, optionally ending with a comma
    const regex = new RegExp(`\\{\\s*id:\\s*['"]` + id + `['"][^\\}]*\\},?`, 'gs');
    const match = content.match(regex);
    if (match) {
        content = content.replace(regex, '');
        deletedCount++;
        console.log('Deleted ' + id);
    } else {
        console.log('Could not find ' + id);
    }
}

fs.writeFileSync(file, content);
console.log('Total deleted: ' + deletedCount);