import * as fs from 'fs';
const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');
const id = 'city_qingkou';
const regex = new RegExp(`\\{\\s*id:\\s*['"]` + id + `['"][^\\}]*\\},?`, 'gs');
content = content.replace(regex, '');
fs.writeFileSync(file, content);
console.log('Deleted ' + id);