import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const citiesToDelete = [
    'city_shaoxing',
    'city_xinzheng',
    'city_culing',
    'city_guluo',
    'city_nara',
    'city_beitian',
    'city_gaoyou',
    'city_onon',
    'city_shangjing_dongdan',
    'city_yinggeling',
    'city_leshou',
    'city_miryang',
    'city_jiuba',
    'city_taigong',
    'city_zhuxian',
    'city_matou',
    'city_yingecheng',
    'city_shajicheng',
    'city_suzihe',
    'city_baimajin',
    'city_pinggang',
    'city_qingyang',
    'city_xiazhou',
    'city_fuping',
    'city_luokou',
    'city_shenglong',
    'city_wufeng',
    'city_beizhou',
    'city_jilin',
    'city_dongtuanshan',
    'city_afrasiyab',
    'city_datengxia',
    'city_guiren'
];

let deletedCount = 0;
for (const id of citiesToDelete) {
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