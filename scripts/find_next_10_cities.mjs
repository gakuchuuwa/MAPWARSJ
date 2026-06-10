import fs from 'fs';
let code = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const regex = /name:\s*['"]([^'"]*州[^'"]*)['"]/g;
let match;
const result = [];
const previous = ['泾州', '江州', '简州', '绛州', '徐州', '福州', '陈州', '扬州', '随州', '常州'];
while ((match = regex.exec(code)) !== null) {
    if (!result.includes(match[1]) && !previous.includes(match[1])) {
        result.push(match[1]);
        if (result.length >= 10) break;
    }
}
console.log(result.join(', '));
