import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\s*id:\s*['"]city_xuchang['"][^\}]+\},?/;
if (content.match(regex)) {
    content = content.replace(regex, '');
    fs.writeFileSync(file, content);
    console.log('Deleted Xuchang successfully.');
} else {
    console.log('Could not find Xuchang.');
}