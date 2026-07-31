const fs = require('fs');
const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
    "id: 'city_heishui_mohe', name: '黑水城', factionId: 'mohe',",
    "id: 'city_heishui_mohe', name: '黑水塞', factionId: 'mohe',"
);

content = content.replace(
    "id: 'city_yongning',\n        name: '永宁',",
    "id: 'city_yongning',\n        name: '赕川',"
);

content = content.replace(
    "id: 'city_yongning2', name: '永宁', factionId: 'she',",
    "id: 'city_yongning2', name: '叙永', factionId: 'she',"
);

fs.writeFileSync(file, content, 'utf-8');
console.log('Renamed duplicate cities in cities_v2.ts');
