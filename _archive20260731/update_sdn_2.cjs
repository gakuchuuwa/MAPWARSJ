const fs = require('fs');
const file = './src/data/SandboxDisplayNames.ts';
let content = fs.readFileSync(file, 'utf-8');

// Update dong to '隆庆'
if (!content.includes(`'dong':`)) {
    content = content.replace(/};/, `    'dong': '隆庆',\n};`);
} else {
    content = content.replace(/'dong':\s*'[^']+'/, `'dong': '隆庆'`);
}

// Update dongxian to '董'
if (!content.includes(`'dongxian':`)) {
    content = content.replace(/};/, `    'dongxian': '董',\n};`);
} else {
    content = content.replace(/'dongxian':\s*'[^']+'/, `'dongxian': '董'`);
}

fs.writeFileSync(file, content, 'utf-8');
console.log('Updated SandboxDisplayNames.ts with 隆庆 and 董');
