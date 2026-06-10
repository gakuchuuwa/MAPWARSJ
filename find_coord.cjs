const fs = require('fs');

const cityContent = fs.readFileSync('./src/data/cities_v2.ts', 'utf-8');
const lines = cityContent.split('\n');
const res = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('109.5') || lines[i].includes('36.6')) {
        res.push(lines[i-1] + '\n' + lines[i] + '\n' + lines[i+1]);
    }
}
console.log(res.join('\n'));
