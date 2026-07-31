const fs = require('fs');
const file = './src/data/SandboxDisplayNames.ts';
let content = fs.readFileSync(file, 'utf-8');

if (!content.includes(`'gar_kham'`)) {
    content = content.replace(/};/, `    'gar_kham': '德格',\n};`);
} else {
    content = content.replace(/'gar_kham':\s*'[^']+'/, `'gar_kham': '德格'`);
}

if (!content.includes(`'dongxian'`)) {
    content = content.replace(/};/, `    'dongxian': '海西',\n};`);
} else {
    content = content.replace(/'dongxian':\s*'[^']+'/, `'dongxian': '海西'`);
}

fs.writeFileSync(file, content, 'utf-8');
console.log('Updated SandboxDisplayNames.ts');
