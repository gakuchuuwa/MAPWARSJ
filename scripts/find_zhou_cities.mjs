import fs from 'fs';
let code = fs.readFileSync('src/data/cities_v2.ts', 'utf8');
const regex = /name:\s*['"]([^'"]*州[^'"]*)['"]/g;
let match;
const result = [];
while ((match = regex.exec(code)) !== null) {
    if (!result.includes(match[1])) {
        result.push(match[1]);
        if (result.length >= 10) break;
    }
}
console.log(result.join(', '));
