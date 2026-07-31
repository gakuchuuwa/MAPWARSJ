const fs = require('fs');
const content = fs.readFileSync('src/data/cities_v2.ts', 'utf-8');
const lines = content.split('\n');
const targets = ['襄平', '国内城', '胜山馆', '囊哈儿卫', '奴儿干', '俱轮泊'];
for (const line of lines) {
    if (targets.some(t => line.includes("name: '" + t + "'"))) {
        console.log(line.trim());
    }
}
