import * as fs from 'fs';

const file = './src/data/cities_v2.ts';
let content = fs.readFileSync(file, 'utf8');

const regex = /\{\s*id:\s*['"]([^'"]+)['"],\s*name:\s*['"]([^'"]+)['"]/g;
const namesToDelete = ['洛口仓', '吉林', '阿弗拉西阿卜古城/撒马尔罕'];
const idsToDelete: string[] = [];

let match;
while ((match = regex.exec(content)) !== null) {
    if (namesToDelete.includes(match[2])) {
        idsToDelete.push(match[1]);
        console.log('Found ' + match[2] + ' with ID ' + match[1]);
    }
}

let deletedCount = 0;
for (const id of idsToDelete) {
    const deleteRegex = new RegExp(`\\{\\s*id:\\s*['"]` + id + `['"][^\\}]*\\},?`, 'gs');
    content = content.replace(deleteRegex, '');
    deletedCount++;
    console.log('Deleted ' + id);
}

fs.writeFileSync(file, content);
console.log('Total fixed deletions: ' + deletedCount);
