import fs from 'fs';
let code = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const regex = /name:\s*['"]([^'"]*州[^'"]*)['"]/g;
let match;
const result = [];
// Skip previously returned cities (these actually shouldn't match anymore since they were renamed, 
// but we include them just in case some didn't match perfectly or were skipped)
const previous = [
    '泾州', '江州', '简州', '绛州', '徐州', '福州', '陈州', '扬州', '随州', '常州',
    '兰州', '婺州', '衢州', '虔州', '迭州', '潘州', '茂州', '银州', '武州塞', '全州',
    '邕州', '登州', '信州', '漳州', '台州', '处州', '田州', '府州', '金州', '贺州'
];
while ((match = regex.exec(code)) !== null) {
    if (!result.includes(match[1]) && !previous.includes(match[1])) {
        result.push(match[1]);
        if (result.length >= 10) break;
    }
}
console.log(result.join(', '));
